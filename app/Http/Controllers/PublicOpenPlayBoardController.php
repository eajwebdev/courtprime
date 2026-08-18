<?php

namespace App\Http\Controllers;

use App\Http\Requests\OpenPlayAddPlayerRequest;
use App\Models\ClubMatch;
use App\Models\OpenPlayMatch;
use App\Models\OpenPlaySession;
use App\Services\MatchScoringService;
use App\Services\OpenPlayRotationService;
use App\Services\OpenPlayService;
use App\Services\PlayerIdentityService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The board the players run.
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
    public function gate(): Response
    {
        return Inertia::render('open-play-gate');
    }

    /** Exchanges the pair for a grant held in the server session. */
    public function enter(Request $request, OpenPlayService $openPlay): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'max:32'],
            'key' => ['required', 'string', 'max:32'],
        ]);

        $session = $openPlay->sessionForCode($request->string('code')->toString(), $request->string('key')->toString());

        $request->session()->put($this->grantKey($session->id), true);
        $this->claimOrganizer($request, $session);

        return to_route('open-play.board.public', ['code' => $session->session_code]);
    }

    public function show(Request $request, string $code, OpenPlayService $openPlay, OpenPlayRotationService $rotation): Response|RedirectResponse
    {
        $session = $this->granted($request, $code, $openPlay);

        if (! $session) {
            return to_route('open-play.gate')->with('success', 'Enter the session ID and key to open the board.');
        }

        $rotation->generate($session);
        $session->refresh()->load('branch');

        return Inertia::render('open-play-board', [
            'session' => [
                'id' => $session->id,
                'name' => $session->name,
                'session_code' => $session->session_code,
                'status' => $session->status,
                'current_round' => $session->current_round,
                'branch' => $session->branch?->name,
            ],
            /* Drives whether the board renders controls or just the score. */
            'isOrganizer' => $this->isOrganizer($request, $session),
            'courts' => $session->courts()->orderBy('court_number')->get(['courts.id', 'name']),
            'liveMatches' => $this->liveMatches($session),
            'waiting' => $this->waiting($session),
            'results' => $this->results($session),
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
        $session = $this->requireGrant($request, $code, $openPlay);
        $this->requireOrganizer($request, $session);

        $player = $identity->findOrCreateLocalPlayer((int) $session->organization_id, [
            'name' => $request->string('name')->toString(),
            'mobile_number' => $request->input('mobile_number'),
            'home_branch_id' => $session->branch_id,
        ]);

        $openPlay->join($session, $player);
        $openPlay->checkIn($session, $player);
        $rotation->generate($session);

        return back()->with('success', $request->string('name')->toString().' is in the rotation.');
    }

    public function score(Request $request, string $code, OpenPlayMatch $match, OpenPlayService $openPlay, MatchScoringService $scoring): RedirectResponse
    {
        $session = $this->requireGrant($request, $code, $openPlay);
        $this->requireOrganizer($request, $session);
        $clubMatch = $this->clubMatchFor($session, $match);

        $request->validate(['team' => ['required', 'in:team_one,team_two']]);

        $scoring->increment($clubMatch, $request->string('team')->toString());

        return back();
    }

    public function undo(Request $request, string $code, OpenPlayMatch $match, OpenPlayService $openPlay, MatchScoringService $scoring): RedirectResponse
    {
        $session = $this->requireGrant($request, $code, $openPlay);
        $this->requireOrganizer($request, $session);
        $clubMatch = $this->clubMatchFor($session, $match);

        $scoring->undo($clubMatch);

        return back();
    }

    /**
     * Settle the match and roll the next one on.
     *
     * The winner is whoever the players say, defaulting to whoever is ahead on
     * the scoreboard, so a game called on the court is recorded the same way as
     * one played out to eleven.
     */
    public function complete(
        Request $request,
        string $code,
        OpenPlayMatch $match,
        OpenPlayService $openPlay,
        OpenPlayRotationService $rotation,
    ): RedirectResponse {
        $session = $this->requireGrant($request, $code, $openPlay);
        $this->requireOrganizer($request, $session);
        $clubMatch = $this->clubMatchFor($session, $match);

        $request->validate(['winner' => ['nullable', 'in:one,two']]);

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

        $rotation->completeMatch($match);

        return back()->with('success', 'Result saved. Next match is up.');
    }

    /* ------------------------------------------------------------------ */

    private function grantKey(int $sessionId): string
    {
        return "open_play_grant.{$sessionId}";
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

        if (! $session || ! $request->session()->get($this->grantKey($session->id))) {
            return null;
        }

        return $session;
    }

    private function requireGrant(Request $request, string $code, OpenPlayService $openPlay): OpenPlaySession
    {
        $session = $this->granted($request, $code, $openPlay);
        abort_unless($session !== null, 403, 'Enter the session ID and key first.');

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
            ->with(['court:id,name', 'participants.player:id,name', 'clubMatch:id,team_one_score,team_two_score'])
            ->orderBy('court_id')
            ->get()
            ->map(fn (OpenPlayMatch $match) => [
                'id' => $match->id,
                'round' => $match->round,
                'court' => $match->court?->name,
                'team_one_score' => $match->clubMatch?->team_one_score ?? 0,
                'team_two_score' => $match->clubMatch?->team_two_score ?? 0,
                'teams' => $match->participants
                    ->groupBy('team')
                    ->map(fn ($group) => $group->map(fn ($entry) => ['id' => $entry->player_id, 'name' => $entry->player?->name])->values())
                    ->all(),
            ])
            ->all();
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

        return $session->queue()
            ->withoutGlobalScope('organization')
            ->with('player:id,name')
            ->whereNotIn('player_id', $playing)
            ->orderBy('position')
            ->get()
            ->map(fn ($entry) => [
                'player_id' => $entry->player_id,
                'name' => $entry->player?->name,
                'games' => $stats[$entry->player_id]['games'] ?? 0,
                'wins' => $stats[$entry->player_id]['wins'] ?? 0,
                'last_round' => $stats[$entry->player_id]['last_round'] ?? null,
            ])
            ->sortBy([['games', 'asc'], ['last_round', 'asc']])
            ->values()
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

    /**
     * First device through the gate takes the controls.
     *
     * Wrapped in a transaction with the row locked: two people can enter the key
     * in the same instant, and a plain read-then-write would let both see an
     * unclaimed session and both become organiser. The lock serialises the
     * claim so exactly one wins and the rest fall through to a read-only board.
     */
    private function claimOrganizer(Request $request, OpenPlaySession $session): void
    {
        $token = DB::transaction(function () use ($session): ?string {
            $locked = OpenPlaySession::query()
                ->withoutGlobalScope('organization')
                ->lockForUpdate()
                ->find($session->id);

            if (! $locked || $locked->organizer_token) {
                return null;
            }

            $fresh = Str::random(48);

            $locked->update([
                'organizer_token' => hash('sha256', $fresh),
                'organizer_claimed_at' => now(),
            ]);

            return $fresh;
        });

        if ($token) {
            $request->session()->put($this->organizerKey($session->id), $token);
        }
    }

    /** The stored token is hashed, so the raw value never sits in the database. */
    private function isOrganizer(Request $request, OpenPlaySession $session): bool
    {
        $token = $request->session()->get($this->organizerKey($session->id));

        return is_string($token)
            && is_string($session->organizer_token)
            && hash_equals($session->organizer_token, hash('sha256', $token));
    }

    /** Controls that change the board are the organiser's alone. */
    private function requireOrganizer(Request $request, OpenPlaySession $session): void
    {
        abort_unless($this->isOrganizer($request, $session), 403, 'Only the session organiser can change the board.');
    }

    private function organizerKey(int $sessionId): string
    {
        return "open-play.organizer.{$sessionId}";
    }
}
