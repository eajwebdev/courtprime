<?php

namespace App\Http\Controllers;

use App\Http\Requests\OpenPlayAddPlayerRequest;
use App\Models\ActivityTimelineEvent;
use App\Models\ClubMatch;
use App\Models\Court;
use App\Models\OpenPlayCourtHold;
use App\Models\OpenPlayMatch;
use App\Models\OpenPlayPlayer;
use App\Models\OpenPlayQueueEntry;
use App\Models\OpenPlaySession;
use App\Models\Player;
use App\Services\MatchScoringService;
use App\Services\OpenPlayCollectionService;
use App\Services\OpenPlayRotationService;
use App\Services\OpenPlayService;
use App\Services\PaddleStackService;
use App\Services\PlayerIdentityService;
use App\Support\NetworkClock;
use App\Support\OpenPlayBoardAccess;
use App\Support\OpenPlayCourtAccess;
use App\Support\OpenPlaySessionLog;
use App\Support\Qr;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The board the players run.
 *
 * The session ID and key are the controls, not an invitation: entering them
 * takes the board, and whoever holds it is the only device that can change
 * anything. Nobody else can open it with the same pair until it is released.
 * Entering the pair does not put you in the rotation either, the holder adds
 * players at the board.
 *
 * The club owner's job ends at creating the session and handing out the code.
 * From there the people on the court add each other, keep score and settle who
 * won, so none of this requires a staff login.
 *
 * Access is the session ID plus its key. The pair is checked once at a gate,
 * then remembered in the server session, so the board is not a URL that can be
 * shared or guessed into. Every action re-checks that grant and re-proves the
 * match belongs to that session, and the routes are throttled.
 *
 * A shared secret rather than an account is deliberate: a drop-in session
 * cannot wait for eight people to register before the first game starts.
 */
class PublicOpenPlayBoardController extends Controller
{
    /** The gate: ID and key, before anything about a session is revealed. */
    /**
     * The way in, with what is currently running.
     *
     * The page used to be a form on an empty screen: no way to tell whether the
     * session you were handed a code for is even on tonight. It now lists the
     * sessions that are open or live, so a player can see what is running and
     * tap the one they are at. The key is still never listed, and neither is
     * whether a board is already held, so the list gives away nothing the
     * discovery page does not.
     */
    public function gate(Request $request): Response
    {
        $today = NetworkClock::today();

        return Inertia::render('open-play-gate', [
            /*
             * A signed-in club's own sessions, openable without the pair.
             *
             * Staff kept landing here from their own admin page and being asked
             * for a secret they hand out to other people. The code and key are
             * for running a board without an account, not a second lock on the
             * people who own the club.
             */
            'mine' => $this->staffSessions($request, $today),
            'active' => OpenPlaySession::query()
                ->withoutGlobalScope('organization')
                ->with(['branch.organization:id,name'])
                ->withCount('players')
                ->whereDate('session_date', '>=', $today)
                ->whereIn('status', ['open', 'live'])
                ->whereHas('branch.organization', fn ($query) => $query->whereIn('status', ['trial', 'active']))
                ->orderBy('session_date')
                ->orderBy('start_time')
                ->limit(12)
                ->get()
                ->map(fn (OpenPlaySession $session) => [
                    'id' => $session->id,
                    'name' => $session->name,
                    'code' => $session->session_code,
                    'status' => $session->status,
                    'players_count' => $session->players_count,
                    'session_date' => $session->session_date?->toDateString(),
                    'start_time' => substr((string) $session->start_time, 0, 5),
                    'end_time' => substr((string) $session->end_time, 0, 5),
                    'branch' => $session->branch?->name,
                    'organization' => $session->branch?->organization?->name,
                ])
                ->all(),
        ]);
    }

    /**
     * The sessions a signed-in user may run without the pair.
     *
     * Authorized one at a time through the same policy the admin pages use, so
     * this lists what they could already manage and never widens it.
     *
     * @return array<int, array<string, mixed>>
     */
    private function staffSessions(Request $request, mixed $today): array
    {
        if (! $request->user()) {
            return [];
        }

        return OpenPlaySession::query()
            ->withoutGlobalScope('organization')
            ->with(['branch.organization:id,name'])
            ->whereIn('status', ['scheduled', 'open', 'live'])
            /* Clubs play past midnight. A session still marked live is still
               the one being run, whatever date it was opened on, and dropping
               it at 00:00 takes the board away from whoever is running it. */
            ->where(fn ($query) => $query->whereDate('session_date', '>=', $today)->orWhere('status', 'live'))
            ->orderByRaw("FIELD(status, 'live', 'open', 'scheduled')")
            ->orderBy('session_date')
            ->orderBy('start_time')
            ->limit(24)
            ->get()
            ->filter(fn (OpenPlaySession $session) => Gate::allows('update', $session))
            ->map(fn (OpenPlaySession $session) => [
                'id' => $session->id,
                'name' => $session->name,
                'code' => $session->session_code,
                'status' => $session->status,
                'session_date' => $session->session_date?->toDateString(),
                'start_time' => substr((string) $session->start_time, 0, 5),
                'end_time' => substr((string) $session->end_time, 0, 5),
                'branch' => $session->branch?->name,
                'held' => (bool) $session->organizer_token && ! OpenPlayBoardAccess::hasGoneQuiet($session),
            ])
            ->values()
            ->all();
    }

    /**
     * Who is scoring each court, for the board to show.
     *
     * A name and whether it is yours, nothing that could be used to take a
     * court off somebody: the hold itself is proved by a token this never
     * carries.
     *
     * @param  array<int, int>  $mine
     * @return array<int, array<string, mixed>>
     */
    private function courtHolders(OpenPlaySession $session, array $mine): array
    {
        return OpenPlayCourtAccess::rows($session)
            ->reject(fn ($hold) => OpenPlayCourtAccess::isStale($hold))
            ->map(fn ($hold) => [
                'court_id' => (int) $hold->court_id,
                'name' => $hold->holder_name ?: 'Someone',
                'mine' => in_array((int) $hold->court_id, $mine, true),
            ])
            ->values()
            ->all();
    }

    /** Exchanges the pair for the board, if nobody else is holding it. */
    public function enter(Request $request, OpenPlayService $openPlay): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'max:32'],
            'key' => ['required', 'string', 'max:32'],
            /* Optional, and only ever used to sign entries in the activity log
               so "who added that player" has an answer. */
            'who' => ['nullable', 'string', 'max:60'],
        ]);

        $session = $openPlay->sessionForCode($request->string('code')->toString(), $request->string('key')->toString());

        /*
         * The pair lets everybody in now, not just the first person.
         *
         * A club with two courts going needs two people scoring them, and the
         * board used to be one device: whoever entered the pair first ran
         * everything and everyone else was turned away with the right
         * credentials in their hand. What is limited is courts — one scorer
         * each — and that is enforced when a court is taken, not at the door.
         *
         * Whoever arrives first also becomes the host and owns the session's
         * setup; `claim` is a no-op for everyone after them.
         */
        OpenPlayBoardAccess::claim($request, $session, $request->input('who'));

        $request->session()->put($this->grantKey($session->id), true);

        if ($name = trim((string) $request->input('who'))) {
            $request->session()->put(OpenPlayBoardAccess::actorKey($session->id), $name);
        }

        OpenPlaySessionLog::record($request, $session, 'open_play.board_opened', 'Opened the board');

        return to_route('open-play.board.public', ['code' => $session->session_code]);
    }

    /**
     * Take a court to score.
     *
     * One device per court: this is where "only as many people as there are
     * courts" is actually enforced. Somebody already scoring it keeps it until
     * they put it down or their device goes quiet.
     */
    public function claimCourt(Request $request, string $code, int $court, OpenPlayService $openPlay): RedirectResponse
    {
        $session = $this->requireGrant($request, $code, $openPlay);

        /* Re-resolved against the session's own courts rather than trusted
           from the URL: the board is reachable with a shared code. */
        $courtModel = $session->courts()->where('courts.id', $court)->first();

        abort_unless($courtModel !== null, 404);

        if (! OpenPlayCourtAccess::claim($request, $session, $courtModel, $this->actorName($request, $session))) {
            return back()->withErrors(['court' => 'Somebody else is scoring '.$courtModel->name.' right now.']);
        }

        $this->log($request, $session, 'open_play.court_taken', 'Took '.$courtModel->name);

        return back()->with('success', 'You are scoring '.$courtModel->name.'.');
    }

    /** Put a court down so somebody else can score it. */
    public function releaseCourt(Request $request, string $code, int $court, OpenPlayService $openPlay): RedirectResponse
    {
        $session = $this->requireGrant($request, $code, $openPlay);

        $courtModel = $session->courts()->where('courts.id', $court)->first();

        abort_unless($courtModel !== null, 404);

        OpenPlayCourtAccess::release($request, $session, $courtModel->id);

        $this->log($request, $session, 'open_play.court_released', 'Put down '.$courtModel->name);

        return back()->with('success', $courtModel->name.' is free for somebody else to score.');
    }

    /** Hand the board back, so the next person can take it with the same pair. */
    public function release(Request $request, string $code, OpenPlayService $openPlay): RedirectResponse
    {
        $session = $this->requireGrant($request, $code, $openPlay);

        OpenPlaySessionLog::record($request, $session, 'open_play.board_released', 'Left the board');
        /* Leaving means leaving: the courts this device was scoring go back
           too, rather than staying locked against the people still here. */
        OpenPlayCourtAccess::releaseAll($request, $session);
        OpenPlayBoardAccess::release($request, $session);

        return to_route('open-play.gate')->with('success', 'Board released. Anyone with the ID and key can take it now.');
    }

    public function show(Request $request, string $code, OpenPlayService $openPlay, OpenPlayRotationService $rotation): Response|RedirectResponse
    {
        $session = $this->granted($request, $code, $openPlay);

        if (! $session) {
            return to_route('open-play.gate')->with('success', 'Enter the session ID and key to open the board.');
        }

        /*
         * Only a started session draws matches. Before that the board is a
         * setup screen, and generating a rotation underneath it would put
         * people on court while the person setting up is still adding them.
         */
        if ($session->status === 'live') {
            $rotation->generate($session);
        }

        /* Every load, including the poll, is the heartbeat that keeps this
           device's holds alive — the session's, and every court it scores. */
        OpenPlayBoardAccess::touch($request, $session);

        $myCourts = OpenPlayCourtAccess::held($request, $session);

        foreach ($myCourts as $courtId) {
            OpenPlayCourtAccess::touch($request, $session, $courtId);
        }

        $session->refresh()->load('branch');

        return Inertia::render('open-play-board', [
            'session' => [
                'id' => $session->id,
                'name' => $session->name,
                'session_code' => $session->session_code,
                'session_key' => $session->session_key,
                'status' => $session->status,
                'started' => $session->status === 'live',
                'current_round' => $session->current_round,
                'format' => $session->format,
                /* The one place the board learns how many a court takes, so it
                   never has to guess from the format string itself. */
                'capacity' => $session->capacity(),
                'auto_rotate' => (bool) $session->auto_rotate,
                'max_consecutive_games' => $session->max_consecutive_games,
                'target_score' => (int) $session->target_score,
                'win_by_two' => (bool) $session->win_by_two,
                'max_players' => $session->max_players,
                'branch' => $session->branch?->name,
                'starts_at' => substr((string) $session->start_time, 0, 5),
                'ends_at' => substr((string) $session->end_time, 0, 5),
            ],
            /*
             * The join code, for players standing at the court.
             *
             * It points at the join page, never at this board: the two are
             * different jobs and the QR is the one everybody sees. Rendered
             * server-side so it is on screen the instant the board loads.
             */
            'joinQr' => Qr::forOpenPlaySession($session),
            /* Whether this device is the host: the one that opened the session
               and owns how it is run. Scoring is a separate question now. */
            'inControl' => OpenPlayBoardAccess::isHolder($request, $session),
            /* The courts this device is scoring, and who has the rest. */
            'myCourts' => $myCourts,
            'courtHolders' => $this->courtHolders($session, $myCourts),
            'you' => $this->actorName($request, $session),
            'courts' => $session->courts()->orderBy('court_number')->get(['courts.id', 'name']),
            'branchCourts' => Court::query()
                ->withoutGlobalScope('organization')
                ->where('branch_id', $session->branch_id)
                ->orderBy('court_number')
                ->get(['id', 'name', 'status']),
            'roster' => $this->roster($session),
            'liveMatches' => $this->liveMatches($session),
            'waiting' => $this->waiting($session),
            /* Who is next, and which two are on each side when they go on. */
            'upNext' => $this->upNext($session, $rotation),
            'results' => $this->results($session),
            'activity' => $this->activity($session),
        ]);
    }

    /** Anyone already through the gate can add whoever just walked in. */
    public function addPlayer(
        OpenPlayAddPlayerRequest $request,
        string $code,
        OpenPlayService $openPlay,
        OpenPlayRotationService $rotation,
        PlayerIdentityService $identity,
    ): RedirectResponse {
        $session = $this->requireBoard($request, $code, $openPlay);

        /*
         * An id means they were picked from the club's own members, so they are
         * used as they are. A name means somebody new at the desk, and the
         * identity service issues them a real record.
         *
         * Typing the name of an existing member used to create a second profile
         * for them: matching only ever looked at email or mobile, never a name,
         * so their games landed on a duplicate.
         */
        $player = $request->filled('player_id')
            ? Player::query()
                ->withoutGlobalScope('organization')
                ->where('organization_id', $session->organization_id)
                ->findOrFail($request->integer('player_id'))
            : $identity->findOrCreateLocalPlayer((int) $session->organization_id, [
                'name' => $request->string('name')->toString(),
                'mobile_number' => $request->input('mobile_number'),
                'home_branch_id' => $session->branch_id,
            ]);

        $openPlay->join($session, $player);
        $openPlay->checkIn($session, $player);

        if ($session->status === 'live') {
            $rotation->generate($session);
        }

        $this->log($request, $session, 'open_play.player_added', 'Added '.$player->name);

        return back()->with('success', $player->name.' is in the rotation.');
    }

    /**
     * Add a point, and finish the game if that point won it.
     *
     * The scoring service completes the underlying club match once a score
     * reaches the target, but the open play match stayed live, so the board
     * kept the court on screen and the next tap was rejected with "completed
     * matches cannot be scored". The optimistic number went up and then fell
     * back, which is what a winning point looked like.
     *
     * A game that is won is over: the result is recorded and the court rolls
     * on, without anybody being asked who won a game the score already
     * settled.
     */
    public function score(
        Request $request,
        string $code,
        OpenPlayMatch $match,
        OpenPlayService $openPlay,
        MatchScoringService $scoring,
        OpenPlayRotationService $rotation,
    ): RedirectResponse {
        $session = $this->requireScorer($request, $code, $match, $openPlay);
        $clubMatch = $this->clubMatchFor($session, $match);

        $request->validate(['team' => ['required', 'in:team_one,team_two']]);

        $scoring->increment($clubMatch, $request->string('team')->toString());

        $clubMatch->refresh();

        if ($clubMatch->status !== 'completed') {
            return back();
        }

        $winner = $clubMatch->team_one_score > $clubMatch->team_two_score ? 'one' : 'two';

        $match->update(['winner_team' => $winner]);
        $rotation->completeMatch($match);

        $this->log(
            $request,
            $session,
            'open_play.match_finished',
            'Won on the last point',
            trim(($match->court?->name ? $match->court->name.' | ' : '')
                .($winner === 'one' ? $clubMatch->team_one_name : $clubMatch->team_two_name).' won'
                .' ('.$clubMatch->team_one_score.'-'.$clubMatch->team_two_score.')'),
        );

        return back()->with('success', 'Game won. Next match is up.');
    }

    public function undo(Request $request, string $code, OpenPlayMatch $match, OpenPlayService $openPlay, MatchScoringService $scoring): RedirectResponse
    {
        $session = $this->requireScorer($request, $code, $match, $openPlay);
        $clubMatch = $this->clubMatchFor($session, $match);

        $request->validate(['team' => ['nullable', 'in:team_one,team_two']]);

        $scoring->undo($clubMatch, null, $request->input('team'));

        return back();
    }

    /**
     * Rearrange who is on which team, and swap players in or out.
     *
     * The rotation pairs people automatically, and it is good at it, but a
     * court full of regulars will still want to fix the teams themselves:
     * levelling up a beginner, keeping a pair together, or splitting two who
     * always partner. Auto is the default, not the rule.
     *
     * `swaps` exchanges somebody on this court for somebody in the queue. It is
     * a straight exchange of places — the player coming off takes the spot in
     * the line the player coming on gave up — so the queue behind them does not
     * move and nobody gets cuts. See PaddleStackService::exchange().
     *
     * Only allowed before anybody has scored. Moving a player across the net
     * mid game would leave points recorded against a team they were not on.
     */
    public function arrangeTeams(
        Request $request,
        string $code,
        OpenPlayMatch $match,
        OpenPlayService $openPlay,
        OpenPlayRotationService $rotation,
        MatchScoringService $scoring,
    ): RedirectResponse {
        $session = $this->requireScorer($request, $code, $match, $openPlay);
        $clubMatch = $this->clubMatchFor($session, $match);

        $data = $request->validate([
            'teams' => ['required', 'array'],
            'teams.*' => ['required', 'in:one,two'],
            /* Keyed by the player on court, valued by the waiting player who
               takes their place. */
            'swaps' => ['nullable', 'array'],
            'swaps.*' => ['required', 'integer'],
            /* Acknowledges that a game already under way starts again. */
            'restart' => ['nullable', 'boolean'],
        ]);

        $started = $clubMatch->team_one_score > 0 || $clubMatch->team_two_score > 0;

        /*
         * Partners change between games, not mid rally — but a court that has
         * already scored used to be refused outright, and the only advice was
         * to tap the points away one at a time. Changing the teams is allowed
         * now and the game restarts at nil all, which is what happens on the
         * court: the points on the board were won by pairs that no longer
         * exist. The board asks first, and this is the acknowledgement.
         */
        if ($started && ! $request->boolean('restart')) {
            return back()->withErrors([
                'teams' => 'This game is under way. Changing partners restarts it at 0-0.',
            ]);
        }

        if ($data['swaps'] ?? []) {
            $error = $this->applySwaps($request, $session, $match, $data['swaps']);

            if ($error) {
                return back()->withErrors(['teams' => $error]);
            }

            $match->refresh();
        }

        $participants = $match->participants()->get();
        $wanted = collect($data['teams']);

        /* A swap replaced somebody, so the sides posted from the board name a
           player who is no longer on this court. The exchange already put the
           incoming player on the outgoing player's side, which is the sensible
           default, so there is nothing left to place. */
        if ($wanted->keys()->diff($participants->pluck('player_id'))->isNotEmpty() && ($data['swaps'] ?? [])) {
            $restarted = $this->restartIfStarted($started, $clubMatch, $scoring);

            $this->log($request, $session, 'open_play.teams_arranged', 'Swapped a player in', $match->court?->name);

            return back()->with('success', $restarted ? 'Court updated. The game restarts at 0-0.' : 'Court updated.');
        }

        /* Every player on the court has to be placed, and the sides have to
           come out even, or the rotation is handing four people two courts. */
        if ($wanted->count() !== $participants->count() || $wanted->keys()->diff($participants->pluck('player_id'))->isNotEmpty()) {
            return back()->withErrors(['teams' => 'Place everyone on the court.']);
        }

        $perSide = intdiv($participants->count(), 2);

        if ($wanted->filter(fn ($side) => $side === 'one')->count() !== $perSide) {
            return back()->withErrors(['teams' => 'The sides have to be even.']);
        }

        DB::transaction(function () use ($participants, $wanted, $match, $clubMatch) {
            foreach ($participants as $participant) {
                $participant->update(['team' => $wanted[$participant->player_id]]);
            }

            /* The club match carries the team names that show on a result, so
               they are rebuilt from who is now on each side. */
            $names = Player::query()
                ->withoutGlobalScope('organization')
                ->whereIn('id', $participants->pluck('player_id'))
                ->pluck('name', 'id');

            $label = fn (string $side) => $participants
                ->filter(fn ($entry) => $wanted[$entry->player_id] === $side)
                ->map(fn ($entry) => (string) ($names[$entry->player_id] ?? 'Player'))
                ->implode(' / ');

            $clubMatch->update([
                'team_one_name' => $label('one'),
                'team_two_name' => $label('two'),
            ]);

            $match->touch();
        });

        $restarted = $this->restartIfStarted($started, $clubMatch, $scoring);

        $this->log(
            $request,
            $session,
            'open_play.teams_arranged',
            'Changed the partners',
            trim(($match->court?->name ?? '').($restarted ? ' | game restarted at 0-0' : '')) ?: null,
        );

        return back()->with('success', $restarted ? 'Partners changed. The game restarts at 0-0.' : 'Partners changed.');
    }

    /**
     * Put a game that was already under way back to nil all.
     *
     * The points on the board were won by pairs that no longer exist, so they
     * cannot be carried into a game between different teams.
     */
    private function restartIfStarted(bool $started, ClubMatch $clubMatch, MatchScoringService $scoring): bool
    {
        if (! $started) {
            return false;
        }

        $scoring->reset($clubMatch);

        return true;
    }

    /**
     * Carry out the swaps posted with an arrange.
     *
     * Every id is re-checked against this session rather than trusted: the
     * board runs on a shared code, so a player id from another club must not be
     * seatable on this court.
     *
     * @param  array<int|string, int>  $swaps
     * @return string|null An error to show, or null if every swap was made.
     */
    private function applySwaps(Request $request, OpenPlaySession $session, OpenPlayMatch $match, array $swaps): ?string
    {
        $stack = app(PaddleStackService::class);

        return DB::transaction(function () use ($request, $session, $match, $swaps, $stack) {
            foreach ($swaps as $outgoingId => $incomingId) {
                $outgoingId = (int) $outgoingId;
                $incomingId = (int) $incomingId;

                if ($outgoingId === $incomingId) {
                    continue;
                }

                if (! $match->participants()->where('player_id', $outgoingId)->exists()) {
                    return 'That player is not on this court any more.';
                }

                $waiting = OpenPlayQueueEntry::query()
                    ->withoutGlobalScope('organization')
                    ->where('open_play_session_id', $session->id)
                    ->where('player_id', $incomingId)
                    ->whereIn('status', [OpenPlayQueueEntry::WAITING, OpenPlayQueueEntry::UP_NEXT])
                    ->exists();

                if (! $waiting) {
                    return 'Whoever comes on has to be in the queue for this session.';
                }

                if (! $stack->exchange($session, $outgoingId, $incomingId)) {
                    return 'That swap could not be made. The game may have moved on.';
                }

                $this->log(
                    $request,
                    $session,
                    'open_play.player_swapped',
                    'Swapped '.($this->playerName($session, $outgoingId) ?? 'a player').' for '.($this->playerName($session, $incomingId) ?? 'a player'),
                    $match->court?->name,
                );
            }

            return null;
        });
    }

    /**
     * Void a match that should never have counted.
     *
     * A cancelled game is not a played game: nobody is credited with it, no
     * streak moves, and the players go back to the queue behind whoever was
     * already waiting. This is the difference between "we called that one off"
     * and "that one finished", which finishing a match with no score would
     * otherwise blur.
     */
    public function cancelMatch(
        Request $request,
        string $code,
        OpenPlayMatch $match,
        OpenPlayService $openPlay,
        OpenPlayRotationService $rotation,
    ): RedirectResponse {
        $session = $this->requireScorer($request, $code, $match, $openPlay);
        $this->clubMatchFor($session, $match);

        $rotation->cancelMatch($match);

        $this->log($request, $session, 'open_play.match_cancelled', 'Cancelled a game', $match->court?->name);

        return back()->with('success', 'Game cancelled. Nobody was credited with it.');
    }

    /**
     * Stop and start the automatic rotation.
     *
     * Paused, a finished game empties its court back into the queue and no new
     * match is drawn, so a session can break for food or a club night without
     * the board dealing people onto courts nobody is standing on.
     */
    public function rotation(Request $request, string $code, OpenPlayService $openPlay, OpenPlayRotationService $rotation): RedirectResponse
    {
        $session = $this->requireHost($request, $code, $openPlay);

        $data = $request->validate(['auto_rotate' => ['required', 'boolean']]);
        $on = (bool) $data['auto_rotate'];

        $session->update(['auto_rotate' => $on]);

        if ($on) {
            /* Resuming deals the waiting queue back out in order. */
            $rotation->generate($session->refresh());
        }

        $this->log(
            $request,
            $session,
            $on ? 'open_play.rotation_resumed' : 'open_play.rotation_paused',
            $on ? 'Resumed the rotation' : 'Paused the rotation',
        );

        return back()->with('success', $on ? 'Rotation running again.' : 'Rotation paused. Courts finish, nothing new starts.');
    }

    /**
     * Put the queue in the order staff says.
     *
     * The stack is FIFO and stays FIFO on its own; this exists for the things
     * it cannot know — somebody who stepped out to their car, a pair who want
     * to play together, a beginner being moved up so they are not last all
     * night. Every one of them is logged.
     */
    public function reorderQueue(Request $request, string $code, OpenPlayService $openPlay): RedirectResponse
    {
        $session = $this->requireHost($request, $code, $openPlay);

        $data = $request->validate([
            'player_ids' => ['required', 'array', 'min:1'],
            'player_ids.*' => ['required', 'integer'],
        ]);

        DB::transaction(fn () => app(PaddleStackService::class)->reorder($session, array_map('intval', $data['player_ids'])));

        $this->log($request, $session, 'open_play.queue_reordered', 'Reordered the queue');

        return back()->with('success', 'Queue updated.');
    }

    /** Move one player to a given place in the line, shifting everyone else along. */
    public function moveInQueue(Request $request, string $code, OpenPlayService $openPlay): RedirectResponse
    {
        $session = $this->requireHost($request, $code, $openPlay);

        $data = $request->validate([
            'player_id' => ['required', 'integer'],
            'position' => ['required', 'integer', 'min:1'],
        ]);

        DB::transaction(fn () => app(PaddleStackService::class)->moveToPosition($session, (int) $data['player_id'], (int) $data['position']));

        $this->log(
            $request,
            $session,
            'open_play.queue_reordered',
            'Moved '.($this->playerName($session, (int) $data['player_id']) ?? 'a player').' to #'.$data['position'],
        );

        return back()->with('success', 'Queue updated.');
    }

    /**
     * Settle the match and roll the next one on.
     *
     * The winner is whoever the players say, defaulting to whoever is ahead on
     * the scoreboard, so a game called on the court is recorded the same way as
     * one played out to eleven.
     *
     * `force_out` and `keep_on` are the staff override of who rotates: the
     * automatic pick is good, but it cannot know that somebody has to leave at
     * nine or that a pair asked for one more.
     */
    public function complete(
        Request $request,
        string $code,
        OpenPlayMatch $match,
        OpenPlayService $openPlay,
        OpenPlayRotationService $rotation,
    ): RedirectResponse {
        $session = $this->requireScorer($request, $code, $match, $openPlay);
        $clubMatch = $this->clubMatchFor($session, $match);

        $request->validate([
            'winner' => ['nullable', 'in:one,two'],
            'force_out' => ['nullable', 'array'],
            'force_out.*' => ['integer'],
            'keep_on' => ['nullable', 'array'],
            'keep_on.*' => ['integer'],
        ]);

        $winner = $request->input('winner') ?: match (true) {
            $clubMatch->team_one_score > $clubMatch->team_two_score => 'one',
            $clubMatch->team_two_score > $clubMatch->team_one_score => 'two',
            default => null,
        };

        DB::transaction(function () use ($clubMatch, $match, $winner) {
            $match->update(['winner_team' => $winner]);

            $clubMatch->update([
                'status' => 'completed',
                'ended_at' => now(),
            ]);
        });

        $rotation->completeMatch(
            $match,
            array_map('intval', $request->input('force_out', [])),
            array_map('intval', $request->input('keep_on', [])),
        );

        $won = $winner === 'one' ? $clubMatch->team_one_name : $clubMatch->team_two_name;

        $this->log(
            $request,
            $session,
            'open_play.match_finished',
            'Recorded a result',
            trim(($match->court?->name ? $match->court->name.' | ' : '')
                .($won ? $won.' won' : 'called a draw')
                .' ('.$clubMatch->team_one_score.'-'.$clubMatch->team_two_score.')'),
        );

        return back()->with('success', 'Result saved. Next match is up.');
    }

    /**
     * Start play.
     *
     * Until this runs the board is a setup screen: courts get chosen, people
     * get added, and nobody is put on a court. Starting flips the session live
     * and draws the first round.
     */
    public function start(Request $request, string $code, OpenPlayService $openPlay, OpenPlayRotationService $rotation): RedirectResponse
    {
        $session = $this->requireHost($request, $code, $openPlay);

        if ($session->status === 'live') {
            return back();
        }

        $courts = $session->courts()->count();
        $players = $session->players()->count();

        /* The same two conditions the button shows, re-checked here: the
           checklist is a convenience, this is the rule. */
        $needed = $rotation->playersPerMatch($session);

        if ($courts < 1 || $players < $needed) {
            return back()->withErrors([
                'start' => $courts < 1
                    ? 'Pick at least one court before starting.'
                    : $needed.' players are needed for the first match.',
            ]);
        }

        $session->update(['status' => 'live', 'auto_rotate' => true]);
        $rotation->generate($session);

        $this->log($request, $session, 'open_play.started', 'Started the session', $players.' players, '.$courts.' courts');

        return back()->with('success', 'Session started. First round is on.');
    }

    /**
     * Close the night from the board.
     *
     * The host's job, like starting it was. A session that has ended stops
     * being a way in — the ID and key are only accepted for a scheduled, open
     * or live session — so this is what turns the pair off for everybody
     * holding it, including whoever is scoring a court right now.
     */
    public function endSession(Request $request, string $code, OpenPlayService $openPlay, OpenPlayRotationService $rotation): RedirectResponse
    {
        $session = $this->requireHost($request, $code, $openPlay);

        if (in_array($session->status, ['completed', 'cancelled'], true)) {
            return to_route('open-play.gate')->with('success', 'That session had already ended.');
        }

        /* Games still on did not finish, so they are cancelled rather than
           credited to somebody because the club closed. */
        $live = OpenPlayMatch::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->where('status', 'live')
            ->get();

        $this->log($request, $session, 'open_play.ended', 'Ended the session', $live->count() > 0 ? $live->count().' unfinished cancelled' : null);

        /*
         * Closed first, then the courts cleared. Cancelling frees a court, and
         * a session still rotating fills a free court straight away — so doing
         * it the other way round drew a replacement for every game cancelled
         * and the night never ended.
         */
        DB::transaction(function () use ($session) {
            $session->update(['status' => 'completed', 'auto_rotate' => false]);

            OpenPlayCourtHold::query()
                ->withoutGlobalScope('organization')
                ->where('open_play_session_id', $session->id)
                ->delete();
        });

        foreach ($live as $match) {
            $rotation->cancelMatch($match);
        }

        OpenPlayCourtAccess::releaseAll($request, $session);
        OpenPlayBoardAccess::release($request, $session);

        return to_route('open-play.gate')->with('success', 'Session ended. Its ID and key no longer open a board.');
    }

    /** Name, scoring and which courts are in play. */
    public function settings(Request $request, string $code, OpenPlayService $openPlay, OpenPlayRotationService $rotation): RedirectResponse
    {
        $session = $this->requireHost($request, $code, $openPlay);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'format' => ['required', 'in:singles,doubles'],
            'target_score' => ['required', 'integer', 'min:7', 'max:31'],
            'win_by_two' => ['required', 'boolean'],
            /* Null is unlimited, which is what a club that lets a winning pair
               stay on expects. */
            'max_consecutive_games' => ['nullable', 'integer', 'min:1', 'max:10'],
            'max_players' => ['nullable', 'integer', 'min:4', 'max:200'],
            'court_ids' => ['array'],
            'court_ids.*' => ['integer'],
        ]);

        /*
         * Courts are re-resolved against the session's own branch rather than
         * trusted from the payload. The board is reachable with a shared code,
         * so an id from another club must not be attachable to this session.
         */
        $courtIds = Court::query()
            ->withoutGlobalScope('organization')
            ->where('branch_id', $session->branch_id)
            ->whereIn('id', $data['court_ids'] ?? [])
            ->pluck('id')
            ->all();

        $changes = [];

        if ($session->name !== $data['name']) {
            $changes[] = 'renamed to '.$data['name'];
        }

        if ((int) $session->target_score !== (int) $data['target_score'] || (bool) $session->win_by_two !== (bool) $data['win_by_two']) {
            $changes[] = 'games to '.$data['target_score'].($data['win_by_two'] ? ', win by 2' : '');
        }

        $existing = $session->courts()->pluck('courts.id')->sort()->values()->all();

        if ($existing !== collect($courtIds)->sort()->values()->all()) {
            $changes[] = count($courtIds).' '.(count($courtIds) === 1 ? 'court' : 'courts').' in play';
        }

        if ($session->format !== $data['format']) {
            $changes[] = $data['format'];
        }

        if ((int) $session->max_consecutive_games !== (int) ($data['max_consecutive_games'] ?? 0)) {
            $changes[] = $data['max_consecutive_games']
                ? 'max '.$data['max_consecutive_games'].' games in a row'
                : 'no limit on games in a row';
        }

        $session->update([
            'name' => $data['name'],
            'format' => $data['format'],
            'target_score' => $data['target_score'],
            'win_by_two' => $data['win_by_two'],
            'max_consecutive_games' => $data['max_consecutive_games'] ?? null,
            /* Absent from the validated data when the client omits it, which
               is not the same as being sent empty: omitting leaves the cap
               alone, sending it empty is the "no limit" the screen offers. */
            'max_players' => array_key_exists('max_players', $data) ? $data['max_players'] : $session->max_players,
        ]);

        /* The pivot carries organization_id and the column has no default, so
           a bare sync() of ids fails on insert. */
        $session->courts()->sync(
            collect($courtIds)->mapWithKeys(fn (int $id) => [$id => ['organization_id' => $session->organization_id]])->all()
        );

        if ($changes !== []) {
            $this->log($request, $session, 'open_play.settings_updated', 'Updated the session', implode(', ', $changes));
        }

        /* A court added mid-session should get a match on it straight away. */
        if ($session->status === 'live') {
            $rotation->generate($session->refresh());
        }

        return back()->with('success', 'Session updated.');
    }

    /**
     * Members of this club, by name, for the board's add field.
     *
     * Only the club running the session, and only what the board needs to show
     * a name and tell two Marcos apart. Anyone already checked in is dropped,
     * so the list is people who could be added rather than people who are here.
     */
    public function searchPlayers(Request $request, string $code, OpenPlayService $openPlay): JsonResponse
    {
        $session = $this->requireGrant($request, $code, $openPlay);
        $term = trim((string) $request->query('q', ''));

        if (mb_strlen($term) < 2) {
            return response()->json(['players' => []]);
        }

        $alreadyIn = $session->players()->pluck('player_id');

        $players = Player::query()
            ->withoutGlobalScope('organization')
            ->where('organization_id', $session->organization_id)
            ->whereNotIn('id', $alreadyIn)
            ->where('name', 'like', '%'.$term.'%')
            ->orderBy('name')
            ->limit(8)
            ->get(['id', 'name', 'skill_level', 'rating', 'mobile_number']);

        return response()->json([
            'players' => $players->map(fn (Player $player) => [
                'id' => $player->id,
                'name' => $player->name,
                'skill_level' => $player->skill_level,
                'rating' => $player->rating,
                /* Enough to tell two people with the same name apart, without
                   publishing a phone number to a shared tablet. */
                'hint' => $player->mobile_number ? '···'.substr((string) $player->mobile_number, -3) : null,
            ])->all(),
        ]);
    }

    /**
     * Take someone out, for a typo or for somebody who went home.
     *
     * Whether the row survives depends on whether they played. See
     * OpenPlayCollectionService: a player with a game behind them stays on the
     * sheet as gone, because the club is still owed their entry.
     */
    public function removePlayer(
        Request $request,
        string $code,
        int $player,
        OpenPlayService $openPlay,
        OpenPlayCollectionService $collections,
    ): RedirectResponse {
        $session = $this->requireBoard($request, $code, $openPlay);

        $onCourt = OpenPlayMatch::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->where('status', 'live')
            ->whereHas('participants', fn ($query) => $query->where('player_id', $player))
            ->exists();

        $name = $this->playerName($session, $player);

        /*
         * Somebody walking off a live court is the normal case, not an error:
         * an ankle goes, a lift arrives. The front of the queue is seated in
         * their place and the game carries on, because the score belongs to
         * the team rather than to the seat. Only an empty queue leaves the
         * court playing a player short.
         */
        if ($onCourt) {
            $substitute = null;

            DB::transaction(function () use ($session, $player, &$substitute) {
                $substitute = app(PaddleStackService::class)->leave($session, $player);
            });

            $collections->removePlayer($session, $player);

            $replacement = $substitute ? $this->playerName($session, $substitute) : null;

            $this->log(
                $request,
                $session,
                'open_play.player_removed',
                'Took '.($name ?? 'a player').' off court',
                $replacement ? $replacement.' came on in their place' : 'Nobody was waiting, so the court is a player short',
            );

            return back()->with('success', $replacement
                ? ($name ?? 'Player').' is off. '.$replacement.' came on.'
                : ($name ?? 'Player').' is off. Nobody was waiting to come on.');
        }

        $outcome = $collections->removePlayer($session, $player);

        $this->log(
            $request,
            $session,
            'open_play.player_removed',
            'Removed '.($name ?? 'a player'),
            $outcome === 'left' ? 'Played already, so their entry stays on the sheet' : null,
        );

        return back()->with('success', $outcome === 'left'
            ? ($name ?? 'Player').' marked as gone. Their entry is still owed.'
            : ($name ?? 'Player').' removed.');
    }

    private function playerName(OpenPlaySession $session, int $playerId): ?string
    {
        return OpenPlayPlayer::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->where('player_id', $playerId)
            ->with('player:id,name')
            ->first()?->player?->name;
    }

    /* ------------------------------------------------------------------ */

    /**
     * Everyone checked in, whether they are playing, waiting or sitting out.
     *
     * @return array<int, array<string, mixed>>
     */
    private function roster(OpenPlaySession $session): array
    {
        $stats = $this->stats($session);

        return $session->players()
            ->withoutGlobalScope('organization')
            /* People who have gone home are off the roster but still on the
               collection sheet, which is where they are settled up. */
            ->where('status', '!=', 'left')
            ->with('player:id,name,skill_level')
            ->get()
            ->map(fn (OpenPlayPlayer $entry) => [
                'player_id' => $entry->player_id,
                'name' => $entry->player?->name ?? 'Player',
                'skill_level' => $entry->player?->skill_level,
                'games' => $stats[$entry->player_id]['games'] ?? 0,
                'wins' => $stats[$entry->player_id]['wins'] ?? 0,
            ])
            ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->all();
    }

    /**
     * What happened on this board, newest first.
     *
     * Anyone with the code can change the session, so the answer to "who added
     * that player" or "who changed the target score" has to live somewhere.
     * This is that record.
     *
     * @return array<int, array<string, mixed>>
     */
    private function activity(OpenPlaySession $session): array
    {
        return ActivityTimelineEvent::query()
            ->withoutGlobalScope('organization')
            ->where('subject_type', OpenPlaySession::class)
            ->where('subject_id', $session->id)
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(fn (ActivityTimelineEvent $event) => [
                'id' => $event->id,
                'type' => $event->event_type,
                'title' => $event->title,
                'description' => $event->description,
                'actor' => $event->metadata['actor_name'] ?? 'Someone',
                'at' => $event->occurred_at?->toIso8601String(),
            ])
            ->all();
    }

    private function log(Request $request, OpenPlaySession $session, string $type, string $title, ?string $description = null): void
    {
        OpenPlaySessionLog::record($request, $session, $type, $title, $description);
    }

    private function actorName(Request $request, OpenPlaySession $session): string
    {
        return OpenPlaySessionLog::actor($request, $session);
    }

    private function grantKey(int $sessionId): string
    {
        return OpenPlayBoardAccess::grantKey($sessionId);
    }

    /** The session behind the code, but only if this browser passed the gate. */
    private function granted(Request $request, string $code, OpenPlayService $openPlay): ?OpenPlaySession
    {
        $session = OpenPlaySession::query()
            ->withoutGlobalScope('organization')
            ->with('branch')
            ->where('session_code', strtoupper(trim($code)))
            ->whereIn('status', ['scheduled', 'open', 'live'])
            ->first();

        if (! $session) {
            return null;
        }

        if ($request->session()->get($this->grantKey($session->id))) {
            return $session;
        }

        /*
         * Staff do not need the code for their own club's session.
         *
         * The ID and key exist so a board can be run by people who are not
         * signed in — a player with a phone, a tablet nobody logs into. A club
         * owner already holds stronger credentials than the pair does, and was
         * being sent to a form to type a secret they own, from a button on
         * their own admin page that promised to open the board.
         */
        return $this->staffGrant($request, $session) ? $session : null;
    }

    /**
     * Let a signed-in member of this club straight in, and give them the board
     * if nobody is running it.
     *
     * Control still belongs to one device: if another tablet is actively
     * holding it, this only opens the board to look at, and taking it over
     * stays the deliberate act it already is — "Sign out that device" on the
     * staff page. Two people scoring the same game is the thing the hold is
     * there to prevent, and being staff does not make that safe.
     */
    private function staffGrant(Request $request, OpenPlaySession $session): bool
    {
        if (! $request->user() || ! Gate::allows('update', $session)) {
            return false;
        }

        /* Claims when the board is free or has gone quiet, and is a no-op when
           somebody else has it — either way this browser may now see it. */
        OpenPlayBoardAccess::claim($request, $session, $request->user()->name);

        $request->session()->put($this->grantKey($session->id), true);

        return true;
    }

    private function requireGrant(Request $request, string $code, OpenPlayService $openPlay): OpenPlaySession
    {
        $session = $this->granted($request, $code, $openPlay);
        abort_unless($session !== null, 403, 'Enter the session ID and key first.');

        return $session;
    }

    /**
     * Only the host may change how the session is run.
     *
     * Settings, starting, pausing the rotation and the order of the queue are
     * one person's job: two people changing the format or the queue at the same
     * time is the clash the single hold was there to prevent, and that much is
     * still true now that scoring has been spread across the courts.
     */
    private function requireHost(Request $request, string $code, OpenPlayService $openPlay): OpenPlaySession
    {
        $session = $this->requireGrant($request, $code, $openPlay);

        abort_unless(
            OpenPlayBoardAccess::isHolder($request, $session),
            403,
            'Only the device that opened this session can change how it is run.',
        );

        return $session;
    }

    /**
     * Anyone running any part of the board may change the roster.
     *
     * A walk-in turns up at whichever court is nearest, and making them wait
     * for the host to be found is how the person at court two ends up not
     * bothering. Every change is signed in the history either way.
     */
    private function requireBoard(Request $request, string $code, OpenPlayService $openPlay): OpenPlaySession
    {
        $session = $this->requireGrant($request, $code, $openPlay);

        abort_unless(
            OpenPlayBoardAccess::isHolder($request, $session) || OpenPlayCourtAccess::held($request, $session) !== [],
            403,
            'Take a court before changing the session.',
        );

        return $session;
    }

    /**
     * Only the device scoring a court may score it.
     *
     * This is what keeps two people off one game. The host may score a court
     * nobody has taken — they set the session up and should not be locked out
     * of finishing a match on an unattended court — but never one somebody
     * else is standing at.
     */
    private function requireScorer(Request $request, string $code, OpenPlayMatch $match, OpenPlayService $openPlay): OpenPlaySession
    {
        $session = $this->requireGrant($request, $code, $openPlay);

        abort_unless($match->open_play_session_id === $session->id, 404);

        $courtId = (int) $match->court_id;

        if (OpenPlayCourtAccess::holds($request, $session, $courtId)) {
            return $session;
        }

        $taken = OpenPlayCourtAccess::rows($session)
            ->first(fn ($hold) => (int) $hold->court_id === $courtId && ! OpenPlayCourtAccess::isStale($hold));

        abort_unless(
            OpenPlayBoardAccess::isHolder($request, $session) && ! $taken,
            403,
            $taken
                ? 'Somebody else is scoring this court.'
                : 'Take this court before scoring it.',
        );

        return $session;
    }

    /** Every action re-proves the match belongs to the session behind the code. */
    private function clubMatchFor(OpenPlaySession $session, OpenPlayMatch $match): ClubMatch
    {
        abort_unless($match->open_play_session_id === $session->id, 404);

        $clubMatch = ClubMatch::query()->withoutGlobalScope('organization')->find($match->club_match_id);
        abort_unless($clubMatch !== null, 404);

        return $clubMatch;
    }

    /** @return array<int, array<string, mixed>> */
    private function liveMatches(OpenPlaySession $session): array
    {
        return OpenPlayMatch::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->where('status', 'live')
            ->with(['court:id,name', 'participants.player:id,name', 'clubMatch:id,team_one_score,team_two_score,serving_team,serving_number,match_type'])
            ->orderBy('court_id')
            ->get()
            ->map(fn (OpenPlayMatch $match) => [
                'id' => $match->id,
                'round' => $match->round,
                'court' => $match->court?->name,
                'team_one_score' => $match->clubMatch?->team_one_score ?? 0,
                'team_two_score' => $match->clubMatch?->team_two_score ?? 0,
                'serving_team' => $match->clubMatch?->serving_team ?? 'team_one',
                'serving_number' => $match->clubMatch ? $this->servingNumber($match->clubMatch) : 2,
                'serve_call' => $match->clubMatch ? $this->serveCall($match->clubMatch) : '0-0-2',
                'teams' => $match->participants
                    ->groupBy('team')
                    ->map(fn ($group) => $group->map(fn ($entry) => ['id' => $entry->player_id, 'name' => $entry->player?->name])->values())
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
     * The next match, as it would be drawn right now.
     *
     * A queue of names answers "when am I on" but not "who with", which in
     * doubles is half the question. This pairs the front of the queue the way
     * the real draw would and hands the board both sides, so the four people
     * about to play can see the teams before they walk on.
     *
     * @return array<string, mixed>|null
     */
    private function upNext(OpenPlaySession $session, OpenPlayRotationService $rotation): ?array
    {
        $stack = app(PaddleStackService::class);
        $capacity = $stack->capacity($session);
        $ids = $stack->upNext($session);

        if ($ids === []) {
            return null;
        }

        $names = Player::query()
            ->withoutGlobalScope('organization')
            ->whereIn('id', $ids)
            ->pluck('name', 'id');

        $named = fn (array $players) => array_values(array_map(
            fn (int $id) => ['id' => $id, 'name' => (string) ($names[$id] ?? 'Player')],
            $players,
        ));

        $pairing = $rotation->previewPairing($session, $ids);

        return [
            'ready' => $pairing !== null,
            /* How many more are needed before these four can go on. */
            'needed' => max(0, $capacity - count($ids)),
            'teams' => $pairing ? ['one' => $named($pairing['one']), 'two' => $named($pairing['two'])] : null,
            'players' => $named($ids),
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function waiting(OpenPlaySession $session): array
    {
        $playing = OpenPlayMatch::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->where('status', 'live')
            ->with('participants:id,open_play_match_id,player_id')
            ->get()
            ->flatMap(fn (OpenPlayMatch $match) => $match->participants->pluck('player_id'))
            ->all();

        $stats = $this->stats($session);

        /*
         * Queue order, not a leaderboard.
         *
         * This used to re-sort by games played, which showed people a different
         * order from the one they would actually be called in. The stack is
         * FIFO, so the board shows the stack.
         */
        $stack = app(PaddleStackService::class);
        $upNext = $stack->upNext($session);
        $now = now();

        return $stack->waitingQueue($session, $playing)
            ->values()
            ->map(function (OpenPlayQueueEntry $entry, int $index) use ($stats, $upNext, $now) {
                $waitingSince = $entry->queue_entered_at ?? $entry->created_at;

                return [
                    'player_id' => $entry->player_id,
                    'name' => $entry->player?->name,
                    'position' => $index + 1,
                    /* Up next is the front of the queue, marked so the people
                       who should be picking their paddles up can see it. */
                    'up_next' => in_array((int) $entry->player_id, $upNext, true),
                    'waiting_seconds' => $waitingSince ? (int) $now->diffInSeconds($waitingSince, true) : 0,
                    'joined_at' => $entry->created_at?->toIso8601String(),
                    'games' => $stats[$entry->player_id]['games'] ?? 0,
                    'wins' => $stats[$entry->player_id]['wins'] ?? 0,
                    'consecutive_games' => (int) $entry->consecutive_games_played,
                ];
            })
            ->all();
    }

    /** Standings for the session so far. @return array<int, array<string, mixed>> */
    private function results(OpenPlaySession $session): array
    {
        $stats = $this->stats($session);

        if ($stats === []) {
            return [];
        }

        $names = DB::table('players')->whereIn('id', array_keys($stats))->pluck('name', 'id');

        return collect($stats)
            ->map(fn (array $row, int $playerId) => [
                'player_id' => $playerId,
                'name' => (string) ($names[$playerId] ?? 'Player'),
                'games' => $row['games'],
                'wins' => $row['wins'],
            ])
            ->sortByDesc(fn (array $row) => [$row['wins'], $row['games']])
            ->values()
            ->all();
    }

    /**
     * Games, wins and last round played, per player, for this session.
     *
     * @return array<int, array{games:int, wins:int, last_round:int}>
     */
    private function stats(OpenPlaySession $session): array
    {
        return DB::table('open_play_match_players as p')
            ->join('open_play_matches as m', 'm.id', '=', 'p.open_play_match_id')
            ->where('m.open_play_session_id', $session->id)
            ->groupBy('p.player_id')
            ->selectRaw('p.player_id, COUNT(*) as games, MAX(m.round) as last_round, SUM(CASE WHEN m.winner_team = p.team THEN 1 ELSE 0 END) as wins')
            ->get()
            ->mapWithKeys(fn ($row) => [(int) $row->player_id => [
                'games' => (int) $row->games,
                'wins' => (int) $row->wins,
                'last_round' => (int) $row->last_round,
            ]])
            ->all();
    }
}
