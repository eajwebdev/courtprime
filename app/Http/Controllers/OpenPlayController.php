<?php

namespace App\Http\Controllers;

use App\Http\Requests\OpenPlayGroupStoreRequest;
use App\Http\Requests\OpenPlaySessionStoreRequest;
use App\Models\Branch;
use App\Models\Court;
use App\Models\OpenPlayMatch;
use App\Models\OpenPlaySession;
use App\Models\OpenPlaySessionCourt;
use App\Models\Player;
use App\Services\OpenPlayCollectionService;
use App\Services\OpenPlayRotationService;
use App\Services\OpenPlayService;
use App\Services\SubscriptionFeatureGate;
use App\Services\TenantContext;
use App\Support\OpenPlayBoardAccess;
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

        $session = OpenPlaySession::query()
            ->with(['branch.courts', 'courts', 'players.player', 'queue.player', 'queue.court'])
            ->when($requested !== '', fn ($query) => $query->where('session_code', strtoupper($requested)))
            ->when($requested === '', fn ($query) => $query->orderByRaw("FIELD(status, 'live', 'open', 'scheduled', 'completed', 'cancelled')"))
            ->orderByDesc('id')
            ->first();

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
                ->orderByRaw("FIELD(status, 'live', 'open', 'scheduled', 'completed', 'cancelled')")
                ->orderByDesc('id')
                ->paginate(10),
            'activeSession' => $session,
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
            ->with(['court:id,name', 'participants.player:id,name,rating', 'clubMatch:id,team_one_score,team_two_score,status'])
            ->orderBy('court_id')
            ->get()
            ->map(fn (OpenPlayMatch $match) => [
                'id' => $match->id,
                'round' => $match->round,
                'court' => $match->court?->name,
                'club_match_id' => $match->club_match_id,
                'team_one_score' => $match->clubMatch?->team_one_score ?? 0,
                'team_two_score' => $match->clubMatch?->team_two_score ?? 0,
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
