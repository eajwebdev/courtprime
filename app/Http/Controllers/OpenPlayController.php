<?php

namespace App\Http\Controllers;

use App\Http\Requests\OpenPlayGroupStoreRequest;
use App\Http\Requests\OpenPlaySessionStoreRequest;
use App\Models\Branch;
use App\Models\ClubMatch;
use App\Models\Court;
use App\Models\OpenPlayCourtHold;
use App\Models\OpenPlayMatch;
use App\Models\OpenPlaySession;
use App\Models\OpenPlaySessionCourt;
use App\Models\Player;
use App\Services\OpenPlayCollectionService;
use App\Services\OpenPlayRotationService;
use App\Services\OpenPlayService;
use App\Services\SubscriptionFeatureGate;
use App\Services\TenantContext;
use App\Support\NetworkClock;
use App\Support\OpenPlayBoardAccess;
use App\Support\Qr;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OpenPlayController extends Controller
{
    public function index(
        Request $request,
        OpenPlayService $openPlay,
        OpenPlayRotationService $rotation,
        TenantContext $tenantContext,
        SubscriptionFeatureGate $subscriptionGate,
    ): Response {
        $this->authorize('viewAny', OpenPlaySession::class);
        $subscriptionGate->ensureAnyFeatureEnabled($tenantContext->currentOrganization(), ['open_play'], 'Open Play');

        /*
         * The one being run, not the one created most recently.
         *
         * A club that lines up next week's sessions in advance was landing on
         * an empty future session while tonight's was live underneath it.
         * Live first, then open, then whatever is newest, and an explicit
         * ?session= always wins so the list on the right can steer this page.
         */
        $requested = trim((string) $request->query('session', ''));

        /*
         * One day at a time, today unless asked otherwise.
         *
         * A club runs open play most nights, so the list grows by one every
         * day and last month's sessions were sitting on top of tonight's. The
         * page opens on today and the date picker is how you reach a previous
         * one — asking for a session by code still wins, and moves the page to
         * that session's own date so the list around it makes sense.
         */
        $session = OpenPlaySession::query()
            ->with(['branch.courts', 'courts', 'players.player', 'queue.player', 'queue.court'])
            ->when($requested !== '', fn ($query) => $query->where('session_code', strtoupper($requested)))
            ->when($requested === '', function ($query) use ($request) {
                $query
                    ->whereDate('session_date', $this->viewedDate($request))
                    ->orderByRaw("FIELD(status, 'live', 'open', 'scheduled', 'completed', 'cancelled')");
            })
            ->orderByDesc('id')
            ->first();

        /* Asked for by code: the date follows the session, not the other way
           round, so the list is not empty underneath it. */
        $date = $requested !== '' && $session?->session_date
            ? $session->session_date->toDateString()
            : $this->viewedDate($request);

        /* Courts free up while nobody is looking at the screen, so a visit is
           also a chance to fill them. Generation is idempotent. */
        if ($session) {
            $rotation->generate($session);
            $session->refresh()->load(['branch.courts', 'courts', 'players.player', 'queue.player', 'queue.court']);
        }

        return Inertia::render('open-play', [
            'sessions' => OpenPlaySession::query()
                ->withCount(['players', 'queue'])
                ->with('branch:id,name')
                ->whereDate('session_date', $date)
                ->orderByRaw("FIELD(status, 'live', 'open', 'scheduled', 'completed', 'cancelled')")
                ->orderByDesc('id')
                ->paginate(10)
                ->withQueryString(),
            /* Which day is on screen, and the days that have anything on them,
               so the picker can say where there is something to look at. */
            'viewedDate' => $date,
            'today' => NetworkClock::today(),
            'sessionDates' => OpenPlaySession::query()
                ->selectRaw('DATE(session_date) as day, COUNT(*) as sessions')
                ->groupBy('day')
                ->orderByDesc('day')
                ->limit(60)
                ->get()
                ->map(fn ($row) => ['date' => (string) $row->day, 'sessions' => (int) $row->sessions])
                ->all(),
            'activeSession' => $session,
            /*
             * The same join code the board shows, on the screen the club is
             * already looking at. A player at the counter scans it instead of
             * being read two strings across a hall; the strings stay on the
             * page for whoever's camera refuses.
             *
             * Absent for a finished session, whose pair opens nothing.
             */
            'joinQr' => $session && ! in_array($session->status, ['completed', 'cancelled'], true)
                ? Qr::forOpenPlaySession($session)
                : null,
            'sessionCourts' => $session ? $session->courts()->orderBy('court_number')->get(['courts.id', 'name', 'court_number']) : [],
            'liveMatches' => $session ? $this->liveMatches($session) : [],
            'waiting' => $session ? $this->waiting($session) : [],
            'standings' => $session ? $this->standings($session) : [],
            /* Kept so an owner can still override the automatic rotation. */
            'recommendedGroup' => $session ? $openPlay->recommendGroup($session, mode: 'skill_based') : [],
            'branches' => Branch::query()->with('courts:id,branch_id,name,court_number')->orderBy('name')->get(),
            /* Who, if anyone, is holding the board, so the office can sign it
               out when the tablet has gone home in somebody's bag. */
            'board' => $session ? [
                'held' => (bool) $session->organizer_token,
                'since' => $session->organizer_claimed_at?->toIso8601String(),
                'last_seen' => $session->organizer_last_seen_at?->toIso8601String(),
                'quiet' => OpenPlayBoardAccess::hasGoneQuiet($session),
            ] : null,
            'collections' => $session ? app(OpenPlayCollectionService::class)->sheet($session) : null,
            'players' => Player::query()->orderByDesc('rating')->get(),
        ]);
    }

    public function store(
        OpenPlaySessionStoreRequest $request,
        OpenPlayService $openPlay,
        OpenPlayRotationService $rotation,
        TenantContext $tenantContext,
        SubscriptionFeatureGate $subscriptionGate,
    ) {
        $this->authorize('create', OpenPlaySession::class);
        $subscriptionGate->ensureAnyFeatureEnabled($tenantContext->currentOrganization(), ['open_play'], 'Open Play');

        $branch = Branch::query()->findOrFail($request->integer('branch_id'));
        $validated = $request->validated();

        /* Every selected court must belong to the session's own branch. */
        $courtIds = Court::query()
            ->withoutGlobalScope('organization')
            ->whereIn('id', $validated['court_ids'])
            ->where('branch_id', $branch->id)
            ->where('organization_id', $branch->organization_id)
            ->pluck('id');

        abort_if($courtIds->count() !== count($validated['court_ids']), 403);

        $session = DB::transaction(function () use ($validated, $branch, $courtIds, $openPlay) {
            /*
             * One open play per branch, covering whichever courts it runs on.
             *
             * The ID and key belong to the session, not to a court: a club
             * hands out one pair for tonight's open play and the rotation
             * spreads everyone who turns up across every court it was given.
             * Splitting the pair per court would split the queue with it.
             */
            $session = OpenPlaySession::query()->create([
                ...collect($validated)->except('court_ids', 'session_code')->all(),
                'organization_id' => $branch->organization_id,
                'session_code' => $openPlay->generateCode($branch->organization_id, $validated['session_code'] ?? null),
                'session_key' => $openPlay->generateKey(),
                'max_players' => $validated['max_players'] ?? 32,
                'entry_fee' => $validated['entry_fee'] ?? 0,
                'status' => 'open',
                'current_round' => 0,
                'auto_rotate' => true,
            ]);

            foreach ($courtIds as $courtId) {
                OpenPlaySessionCourt::query()->create([
                    'organization_id' => $branch->organization_id,
                    'open_play_session_id' => $session->id,
                    'court_id' => $courtId,
                ]);
            }

            return $session;
        });

        $rotation->generate($session);

        return back()->with('success', "Session created. Share ID {$session->session_code} and key {$session->session_key}.");
    }

    /**
     * The day being looked at: today unless a valid one is asked for.
     *
     * Anything unparseable falls back to today rather than erroring — this is
     * a query string on a page somebody may have bookmarked.
     */
    private function viewedDate(Request $request): string
    {
        $asked = trim((string) $request->query('date', ''));

        if ($asked === '') {
            return NetworkClock::today();
        }

        try {
            return CarbonImmutable::parse($asked)->toDateString();
        } catch (\Throwable) {
            return NetworkClock::today();
        }
    }

    /**
     * Close the night.
     *
     * A session that has ended stops being a way in: the ID and key are only
     * accepted for a scheduled, open or live session, so ending one turns the
     * pair off for everybody holding it. The board is signed out and every
     * court put down with it, because a session nobody can open is not a
     * session anybody should still be scoring.
     *
     * Games still on the courts are cancelled rather than finished. They did
     * not finish; crediting somebody with a win because the club closed would
     * be inventing a result.
     */
    public function endSession(OpenPlaySession $session, OpenPlayRotationService $rotation): RedirectResponse
    {
        $this->authorize('update', $session);

        if (in_array($session->status, ['completed', 'cancelled'], true)) {
            return back()->with('success', 'That session had already ended.');
        }

        $live = OpenPlayMatch::query()
            ->where('open_play_session_id', $session->id)
            ->where('status', 'live')
            ->get();

        /*
         * Closed first, then the courts cleared.
         *
         * Cancelling a match frees a court, and a session still rotating fills
         * a free court straight away — so cancelling before closing drew a
         * replacement for every game cancelled and the night would not end.
         */
        DB::transaction(function () use ($session) {
            $session->update([
                'status' => 'completed',
                'auto_rotate' => false,
                /* The hold, so the board is not left flagged as running. */
                'organizer_token' => null,
                'organizer_claimed_at' => null,
                'organizer_last_seen_at' => null,
            ]);

            OpenPlayCourtHold::query()->where('open_play_session_id', $session->id)->delete();
        });

        foreach ($live as $match) {
            $rotation->cancelMatch($match);
        }

        $unfinished = $live->count();

        return back()->with('success', 'Session ended. The ID and key no longer open it.'
            .($unfinished > 0 ? " {$unfinished} unfinished ".($unfinished === 1 ? 'game was' : 'games were').' cancelled.' : ''));
    }

    /**
     * Sign the board out from the office.
     *
     * A board is held by one device, and it is handed back by whoever is
     * holding it. Players go home without doing that: the tablet gets put in a
     * drawer, or the phone that opened it walks out of the building. This is
     * how staff take the hold back so the next person can use the same ID and
     * key.
     */
    public function releaseBoard(OpenPlaySession $session): RedirectResponse
    {
        $this->authorize('update', $session);

        $session->update([
            'organizer_token' => null,
            'organizer_claimed_at' => null,
            'organizer_last_seen_at' => null,
        ]);

        return back()->with('success', 'Board signed out. Anyone with the ID and key can open it now.');
    }

    /**
     * Take entry money.
     *
     * Staff only, and deliberately not on the session board: that board is
     * opened with an ID and key handed out at the desk, so anybody running a
     * court could otherwise mark the money as collected. What is owed follows
     * from who played, which the board decides; who has paid is the club's
     * record, which is here.
     */
    public function settlePlayer(Request $request, OpenPlaySession $session, int $player, OpenPlayCollectionService $collections): RedirectResponse
    {
        $this->authorize('update', $session);

        $data = $request->validate(['amount' => ['nullable', 'numeric', 'min:0', 'max:100000']]);

        $collections->settle($session, $player, isset($data['amount']) ? (float) $data['amount'] : null);

        return back()->with('success', 'Payment recorded.');
    }

    /** Staff adding a walk-in who has no phone on them. */
    public function join(OpenPlaySession $session, Player $player, OpenPlayService $openPlay, OpenPlayRotationService $rotation)
    {
        $this->authorize('update', $session);
        $this->authorize('view', $player);

        $openPlay->join($session, $player);
        $rotation->generate($session);

        return back()->with('success', 'Player joined the session.');
    }

    public function checkIn(OpenPlaySession $session, Player $player, OpenPlayService $openPlay, OpenPlayRotationService $rotation)
    {
        $this->authorize('update', $session);
        $this->authorize('view', $player);

        $openPlay->checkIn($session, $player);
        $rotation->generate($session);

        return back()->with('success', 'Open play player checked in.');
    }

    /**
     * Report a finished match and roll straight into the next round.
     *
     * The score itself is already recorded by the existing scoring flow; this
     * releases the court, returns the four to the queue and refills.
     */
    public function completeMatch(OpenPlaySession $session, OpenPlayMatch $match, OpenPlayRotationService $rotation)
    {
        $this->authorize('update', $session);
        abort_unless($match->open_play_session_id === $session->id, 404);

        $rotation->completeMatch($match);

        return back()->with('success', 'Court released. Next round assigned.');
    }

    /** Manual override, unchanged, for the cases automation cannot know about. */
    public function group(OpenPlayGroupStoreRequest $request, OpenPlaySession $session, OpenPlayService $openPlay)
    {
        $this->authorize('update', $session);

        $validated = $request->validated();

        if (! empty($validated['court_id'])) {
            $courtBelongsToSessionBranch = Court::query()
                ->withoutGlobalScope('organization')
                ->whereKey($validated['court_id'])
                ->where('branch_id', $session->branch_id)
                ->where('organization_id', $session->organization_id)
                ->exists();

            abort_unless($courtBelongsToSessionBranch, 403);
        }

        $openPlay->buildGroup(
            $session,
            (int) $validated['group_size'],
            $validated['mode'],
            $validated['court_id'] ?? null,
            $validated['player_ids'] ?? [],
        );

        return back()->with('success', 'Open play group called to court.');
    }

    /* ------------------------------------------------------------------ */

    /** @return array<int, array<string, mixed>> */
    private function liveMatches(OpenPlaySession $session): array
    {
        return OpenPlayMatch::query()
            ->where('open_play_session_id', $session->id)
            ->where('status', 'live')
            ->with(['court:id,name', 'participants.player:id,name,rating', 'clubMatch:id,team_one_score,team_two_score,serving_team,serving_number,match_type,status'])
            ->orderBy('court_id')
            ->get()
            ->map(fn (OpenPlayMatch $match) => [
                'id' => $match->id,
                'round' => $match->round,
                'court' => $match->court?->name,
                'club_match_id' => $match->club_match_id,
                'team_one_score' => $match->clubMatch?->team_one_score ?? 0,
                'team_two_score' => $match->clubMatch?->team_two_score ?? 0,
                'serving_team' => $match->clubMatch?->serving_team ?? 'team_one',
                'serving_number' => $match->clubMatch ? $this->servingNumber($match->clubMatch) : 2,
                'serve_call' => $match->clubMatch ? $this->serveCall($match->clubMatch) : '0-0-2',
                'teams' => $match->participants
                    ->groupBy('team')
                    ->map(fn ($group) => $group->map(fn ($entry) => [
                        'id' => $entry->player_id,
                        'name' => $entry->player?->name,
                        'rating' => (float) ($entry->player?->rating ?? 0),
                    ])->values())
                    ->all(),
            ])
            ->all();
    }

    private function servingTeam(ClubMatch $match): string
    {
        return in_array($match->serving_team, ['team_one', 'team_two'], true) ? $match->serving_team : 'team_one';
    }

    private function servingNumber(ClubMatch $match): ?int
    {
        if ($match->match_type === 'singles') {
            return null;
        }

        $number = (int) ($match->serving_number ?? 0);

        if (in_array($number, [1, 2], true)) {
            return $number;
        }

        return (int) $match->team_one_score === 0 && (int) $match->team_two_score === 0 && $this->servingTeam($match) === 'team_one' ? 2 : 1;
    }

    private function serveCall(ClubMatch $match): string
    {
        $servingTeam = $this->servingTeam($match);
        $serverScore = $servingTeam === 'team_one' ? (int) $match->team_one_score : (int) $match->team_two_score;
        $receiverScore = $servingTeam === 'team_one' ? (int) $match->team_two_score : (int) $match->team_one_score;
        $servingNumber = $this->servingNumber($match);

        return $servingNumber ? "{$serverScore}-{$receiverScore}-{$servingNumber}" : "{$serverScore}-{$receiverScore}";
    }

    /**
     * The waiting list, in the order the rotation will actually call them.
     *
     * @return array<int, array<string, mixed>>
     */
    private function waiting(OpenPlaySession $session): array
    {
        $playing = OpenPlayMatch::query()
            ->where('open_play_session_id', $session->id)
            ->where('status', 'live')
            ->with('participants:id,open_play_match_id,player_id')
            ->get()
            ->flatMap(fn (OpenPlayMatch $match) => $match->participants->pluck('player_id'))
            ->all();

        $stats = $this->sessionStats($session);

        return $session->queue()
            ->with('player:id,name,rating')
            ->whereNotIn('player_id', $playing)
            ->orderBy('position')
            ->get()
            ->map(fn ($entry) => [
                'player_id' => $entry->player_id,
                'name' => $entry->player?->name,
                'rating' => (float) ($entry->player?->rating ?? 0),
                'games' => $stats[$entry->player_id]['games'] ?? 0,
                'last_round' => $stats[$entry->player_id]['last_round'] ?? null,
            ])
            ->sortBy([['games', 'asc'], ['last_round', 'asc']])
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function standings(OpenPlaySession $session): array
    {
        $stats = $this->sessionStats($session);

        return collect($stats)
            ->map(fn (array $row, int $playerId) => ['player_id' => $playerId] + $row)
            ->sortByDesc('games')
            ->values()
            ->all();
    }

    /** @return array<int, array{games:int, last_round:int}> */
    private function sessionStats(OpenPlaySession $session): array
    {
        return DB::table('open_play_match_players')
            ->join('open_play_matches', 'open_play_matches.id', '=', 'open_play_match_players.open_play_match_id')
            ->where('open_play_matches.open_play_session_id', $session->id)
            ->groupBy('open_play_match_players.player_id')
            ->selectRaw('open_play_match_players.player_id, COUNT(*) as games, MAX(open_play_matches.round) as last_round')
            ->get()
            ->mapWithKeys(fn ($row) => [(int) $row->player_id => ['games' => (int) $row->games, 'last_round' => (int) $row->last_round]])
            ->all();
    }
}
