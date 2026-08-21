<?php

namespace App\Services;

use App\Models\ClubMatch;
use App\Models\Court;
use App\Models\MatchGame;
use App\Models\OpenPlayMatch;
use App\Models\OpenPlayMatchPlayer;
use App\Models\OpenPlayPlayer;
use App\Models\OpenPlayQueueEntry;
use App\Models\OpenPlaySession;
use App\Models\Player;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Automatic open play rotation.
 *
 * The owner allocates courts and shares a code; everything after that is
 * decided here. Fair rotation, not random teams:
 *
 *   1. fewest games played goes on first
 *   2. then whoever has waited longest (lowest last round played)
 *   3. then whoever sat out the previous round
 *   4. partners are varied — among players coming off the queue. A pair that
 *      holds the court keeps playing together; see bestPairing().
 *   5. opponents are varied
 *   6. nobody plays many consecutive rounds while others wait
 *   7. teams are balanced by rating when ratings exist
 *
 * 1–3 and 6 decide *who* plays; 4, 5 and 7 decide *how the four are split*,
 * which is only three possible pairings, so it is scored exhaustively rather
 * than approximated.
 */
class OpenPlayRotationService
{
    public function __construct(
        private readonly MatchResultService $results,
        private readonly PaddleStackService $stack,
    ) {}

    /** Weightings for the pairing score. Repeating a partner is the worst of the three. */
    private const PARTNER_PENALTY = 10.0;

    private const OPPONENT_PENALTY = 4.0;

    private const IMBALANCE_PENALTY = 2.0;

    /**
     * Fill every free allocated court that there are players for.
     *
     * Idempotent by design: it only ever fills courts with no live match, so
     * calling it after a join, after a result, or on a page load cannot double
     * book anyone.
     *
     * @return Collection<int, OpenPlayMatch>
     */
    public function generate(OpenPlaySession $session): Collection
    {
        return DB::transaction(function () use ($session) {
            $session->refresh();

            if (! $session->auto_rotate) {
                return collect();
            }

            $freeCourts = $this->freeCourts($session);

            if ($freeCourts->isEmpty()) {
                return collect();
            }

            $available = $this->availablePlayers($session);

            /* Two for singles, four for doubles. */
            $perMatch = $this->playersPerMatch($session);

            if ($available->count() < $perMatch) {
                return collect();
            }

            $history = $this->history($session);
            $round = (int) $session->current_round + 1;
            $created = collect();

            foreach ($freeCourts as $court) {
                if ($available->count() < $perMatch) {
                    break;
                }

                $group = $this->pickGroup($available, $history, $perMatch);
                $available = $available->reject(fn (array $entry) => in_array($entry['player_id'], $group->pluck('player_id')->all(), true))->values();

                $created->push($this->createMatch($session, $court, $group, $history, $round));
            }

            if ($created->isNotEmpty()) {
                $session->update(['current_round' => $round, 'status' => 'live']);
            }

            return $created;
        });
    }

    /**
     * Close out a finished match and immediately fill the court it freed.
     *
     * `$forceOut` and `$keep` are staff's override of the automatic priority
     * pick — see PaddleStackService::plan(). Empty by default, which is the
     * automatic rotation exactly as it always ran.
     *
     * @param  array<int, int>  $forceOut
     * @param  array<int, int>  $keep
     * @return Collection<int, OpenPlayMatch>
     */
    public function completeMatch(OpenPlayMatch $match, array $forceOut = [], array $keep = []): Collection
    {
        $created = DB::transaction(function () use ($match, $forceOut, $keep) {
            /*
             * Locked and re-read before anything is counted.
             *
             * Anyone holding the session key can finish a match, and on a
             * tablet passed between people two taps on Finish land within the
             * same second. Without this the second one credits every player
             * with the win a second time, and rotates the court twice.
             */
            $locked = OpenPlayMatch::query()
                ->withoutGlobalScope('organization')
                ->lockForUpdate()
                ->find($match->id);

            if (! $locked || $locked->status === 'completed') {
                return collect();
            }

            $locked->update(['status' => 'completed', 'completed_at' => now()]);
            $match->setAttribute('status', 'completed');

            /* The result reaches the players' records here, and only here. */
            $this->results->recordOpenPlay($locked);

            $session = $locked->session()->withoutGlobalScope('organization')->lockForUpdate()->first();

            if (! $session) {
                return collect();
            }

            $onCourt = $locked->participants()->pluck('player_id')->map(fn ($id) => (int) $id)->all();

            /*
             * A paused session empties the court instead of rotating into it.
             *
             * No next game is going to start, so nobody can be sent on: marking
             * the incoming players as on court would strand them there with no
             * match, invisible to both the queue and the board. Everyone who
             * just played goes to the back of the queue and resuming deals them
             * out again in order.
             */
            if (! $session->auto_rotate) {
                $this->stack->apply($session, ['stay' => [], 'out' => $onCourt, 'in' => []], null);

                return collect();
            }

            /*
             * The stack decides how many come off. Nobody waiting means the
             * same players carry on; one waiting means one swap. Emptying the
             * court unconditionally was only ever right when the queue happened
             * to be long.
             */
            $plan = $this->stack->plan($session, $onCourt, $forceOut, $keep);
            $this->stack->apply($session, $plan, $locked->court_id);

            $next = array_merge($plan['stay'], $plan['in']);

            if (count($next) < $this->playersPerMatch($session) || ! $locked->court) {
                /*
                 * Not enough left to refill this court — players left, or the
                 * court was pulled out of the session. Whoever is still stood on
                 * it goes back into the queue rather than being held on a court
                 * with no game, and generate() decides what can run.
                 */
                $this->stack->apply($session, ['stay' => [], 'out' => $plan['stay'], 'in' => []], null);

                return collect();
            }

            $round = (int) $session->current_round + 1;
            $history = $this->history($session);
            $group = $this->entriesFor($next);

            /*
             * Partners who are both staying on stay partners.
             *
             * The pairing score treats a repeated partner as the worst thing it
             * can do, so a pair that won and held the court was being split up
             * for the very next game — the club sets a team, the team wins, and
             * the board hands them each somebody else. The court keeps its
             * teams; the queue is where fresh partners come from.
             */
            $keepTogether = $this->pairsStayingOn($locked, $plan['stay']);

            $created = collect([$this->createMatch($session, $locked->court, $group, $history, $round, $keepTogether)]);

            $session->update(['current_round' => $round, 'status' => 'live']);

            return $created;
        });

        /* Any other court the finished game freed up players for. */
        return $created->concat($this->generate($match->session()->withoutGlobalScope('organization')->first()));
    }

    /**
     * Void a match that never should have counted: wrong players, a
     * double-booked court, a false start. Nothing is credited — no game, no
     * win, no streak — and the players who were on it go back to the queue
     * exactly as PaddleStackService::release() leaves them, behind whoever was
     * already waiting.
     *
     * @return Collection<int, OpenPlayMatch>
     */
    public function cancelMatch(OpenPlayMatch $match): Collection
    {
        $created = DB::transaction(function () use ($match) {
            $locked = OpenPlayMatch::query()
                ->withoutGlobalScope('organization')
                ->lockForUpdate()
                ->find($match->id);

            if (! $locked || $locked->status !== 'live') {
                return collect();
            }

            $participantIds = $locked->participants()->pluck('player_id')->map(fn ($id) => (int) $id)->all();

            $locked->update(['status' => 'cancelled']);

            $clubMatch = ClubMatch::query()->withoutGlobalScope('organization')->find($locked->club_match_id);
            $clubMatch?->update(['status' => 'cancelled', 'ended_at' => now()]);

            $session = $locked->session()->withoutGlobalScope('organization')->first();

            if ($session) {
                $this->stack->release($session, $participantIds);
            }

            return collect();
        });

        /* The court this freed, and any other, gets a fresh look. */
        return $created->concat($this->generate($match->session()->withoutGlobalScope('organization')->first()));
    }

    /**
     * How the next lot would be split, without committing to it.
     *
     * The queue told people who was next but not who they would be playing
     * with, which is the thing anybody waiting actually wants to know — a
     * doubles session is four names, and which two are on your side decides
     * whether you are looking forward to it.
     *
     * Scored by the same pairing rules the real draw uses, so what is shown is
     * what would happen if the next court freed up now. It is a prediction, not
     * a reservation: somebody leaving, or a game finishing on another court,
     * changes it, and the board says so.
     *
     * @param  array<int, int>  $playerIds
     * @return array{one: array<int, int>, two: array<int, int>}|null
     */
    public function previewPairing(OpenPlaySession $session, array $playerIds): ?array
    {
        if (count($playerIds) < $this->playersPerMatch($session)) {
            return null;
        }

        $pairing = $this->bestPairing($this->entriesFor($playerIds), $this->history($session));

        return [
            'one' => array_map(fn (array $entry) => (int) $entry['player_id'], $pairing['one']),
            'two' => array_map(fn (array $entry) => (int) $entry['player_id'], $pairing['two']),
        ];
    }

    /**
     * Shape player ids into what the pairing scorer expects.
     *
     * @param  array<int, int>  $playerIds
     * @return Collection<int, array{player_id:int, rating:float}>
     */
    private function entriesFor(array $playerIds): Collection
    {
        $ratings = Player::query()
            ->withoutGlobalScope('organization')
            ->whereIn('id', $playerIds)
            ->pluck('rating', 'id');

        return collect($playerIds)
            ->map(fn (int $id) => ['player_id' => $id, 'rating' => (float) ($ratings[$id] ?? 0)])
            ->values();
    }

    /* ------------------------------------------------------------------ */
    /* Selection */
    /* ------------------------------------------------------------------ */

    /**
     * Courts the owner allocated that are not mid-match.
     *
     * @return Collection<int, Court>
     */
    private function freeCourts(OpenPlaySession $session): Collection
    {
        $busy = OpenPlayMatch::query()
            ->where('open_play_session_id', $session->id)
            ->where('status', 'live')
            ->pluck('court_id')
            ->all();

        return $session->courts()->orderBy('court_number')->get()->reject(fn (Court $court) => in_array($court->id, $busy, true))->values();
    }

    /**
     * Everyone in the session who is not currently on a court, ordered by the
     * spec's priority: fewest games, then longest wait, then queue position.
     *
     * @return Collection<int, array{player_id:int, rating:float, games:int, last_round:int, position:int}>
     */
    private function availablePlayers(OpenPlaySession $session): Collection
    {
        $playing = OpenPlayMatch::query()
            ->where('open_play_session_id', $session->id)
            ->where('status', 'live')
            ->with('participants:id,open_play_match_id,player_id')
            ->get()
            ->flatMap(fn (OpenPlayMatch $match) => $match->participants->pluck('player_id'))
            ->all();

        $stats = $this->playerStats($session);

        return OpenPlayQueueEntry::query()
            ->with('player:id,rating')
            ->where('open_play_session_id', $session->id)
            ->whereNotIn('player_id', $playing)
            ->whereIn('status', [OpenPlayQueueEntry::WAITING, OpenPlayQueueEntry::UP_NEXT])
            ->orderBy('position')
            ->get()
            ->map(fn (OpenPlayQueueEntry $entry) => [
                'player_id' => (int) $entry->player_id,
                'rating' => (float) ($entry->player?->rating ?? 0),
                'games' => $stats[$entry->player_id]['games'] ?? 0,
                /* Never played sorts before everyone who has. */
                'last_round' => $stats[$entry->player_id]['last_round'] ?? -1,
                'position' => (int) $entry->position,
            ])
            ->sortBy([
                ['games', 'asc'],
                ['last_round', 'asc'],
                ['position', 'asc'],
            ])
            ->values();
    }

    /**
     * Games played and last round played, per player, for this session.
     *
     * @return array<int, array{games:int, last_round:int}>
     */
    private function playerStats(OpenPlaySession $session): array
    {
        return OpenPlayMatchPlayer::query()
            ->join('open_play_matches', 'open_play_matches.id', '=', 'open_play_match_players.open_play_match_id')
            ->where('open_play_matches.open_play_session_id', $session->id)
            /* A cancelled match never happened, so it counts toward nobody's
               games and cannot make the next round repeat its pairing. */
            ->where('open_play_matches.status', '!=', 'cancelled')
            ->groupBy('open_play_match_players.player_id')
            ->selectRaw('open_play_match_players.player_id, COUNT(*) as games, MAX(open_play_matches.round) as last_round')
            ->get()
            ->mapWithKeys(fn ($row) => [(int) $row->player_id => ['games' => (int) $row->games, 'last_round' => (int) $row->last_round]])
            ->all();
    }

    /**
     * How often each pair has partnered and how often they have opposed.
     *
     * Keyed on the ordered pair "lowId-highId" so a lookup is symmetric.
     *
     * @return array{partners: array<string,int>, opponents: array<string,int>}
     */
    private function history(OpenPlaySession $session): array
    {
        $partners = [];
        $opponents = [];

        $matches = OpenPlayMatch::query()
            ->where('open_play_session_id', $session->id)
            ->where('status', '!=', 'cancelled')
            ->with('participants:id,open_play_match_id,player_id,team')
            ->get();

        foreach ($matches as $match) {
            $teams = $match->participants->groupBy('team')->map(fn ($group) => $group->pluck('player_id')->all());

            foreach ($teams as $members) {
                foreach ($this->pairs($members) as $key) {
                    $partners[$key] = ($partners[$key] ?? 0) + 1;
                }
            }

            $one = $teams->get('one', []);
            $two = $teams->get('two', []);

            foreach ($one as $a) {
                foreach ($two as $b) {
                    $key = $this->pairKey($a, $b);
                    $opponents[$key] = ($opponents[$key] ?? 0) + 1;
                }
            }
        }

        return ['partners' => $partners, 'opponents' => $opponents];
    }

    /**
     * The four who play next.
     *
     * The first three are simply the highest priority. The fourth is chosen
     * from a short shortlist to avoid locking the same quartet together every
     * round — rule 6 — while never letting someone with more games jump ahead
     * of someone with fewer.
     *
     * @param  Collection<int, array{player_id:int, rating:float, games:int, last_round:int, position:int}>  $available
     * @param  array{partners: array<string,int>, opponents: array<string,int>}  $history
     * @return Collection<int, array{player_id:int, rating:float, games:int, last_round:int, position:int}>
     */
    /** How many players a court takes in this session's format. */
    public function playersPerMatch(OpenPlaySession $session): int
    {
        return $session->capacity();
    }

    /**
     * The players for one court.
     *
     * Singles needs no pairing search, the two at the front of the queue play
     * each other, so the variety scoring only runs for doubles where there is
     * an actual choice of partners.
     */
    private function pickGroup(Collection $available, array $history, int $size): Collection
    {
        if ($size < 4) {
            return $available->take($size)->values();
        }

        $core = $available->take(3);

        /* Only players tied on games with the next in line are eligible to be
           swapped in, so fairness is never traded for variety. */
        $rest = $available->slice(3)->values();

        if ($rest->isEmpty()) {
            return $available->take(4)->values();
        }

        $leadGames = $rest->first()['games'];
        $shortlist = $rest->filter(fn (array $entry) => $entry['games'] === $leadGames)->values();

        if ($shortlist->count() <= 1) {
            return $core->concat([$rest->first()])->values();
        }

        $best = null;
        $bestScore = null;

        foreach ($shortlist as $candidate) {
            $quartet = $core->concat([$candidate])->values();
            $score = $this->bestPairing($quartet, $history)['score'];

            if ($bestScore === null || $score < $bestScore) {
                $bestScore = $score;
                $best = $candidate;
            }
        }

        return $core->concat([$best])->values();
    }

    /**
     * Cheapest of the three ways to split four players into two teams.
     *
     * `$keepTogether` names pairs that are already a team and are staying on
     * the court. Those splits are the only ones considered, so a pairing that
     * has been set — by winning and staying on, or by hand at the board — is
     * not undone by the variety scoring, which otherwise penalises a repeated
     * partner harder than anything else and so actively split them up.
     *
     * @param  Collection<int, array{player_id:int, rating:float}>  $quartet
     * @param  array{partners: array<string,int>, opponents: array<string,int>}  $history
     * @param  array<int, array{0:int, 1:int}>  $keepTogether
     * @return array{score: float, one: array<int, array>, two: array<int, array>}
     */
    private function bestPairing(Collection $quartet, array $history, array $keepTogether = []): array
    {
        $players = $quartet->values()->all();

        if (count($players) < 4) {
            /* Split down the middle. Slicing at two put both singles players on
               the same side and left the other side empty. */
            $half = max(1, intdiv(count($players), 2));

            return ['score' => 0.0, 'one' => array_slice($players, 0, $half), 'two' => array_slice($players, $half)];
        }

        [$a, $b, $c, $d] = $players;

        $splits = [
            [[$a, $b], [$c, $d]],
            [[$a, $c], [$b, $d]],
            [[$a, $d], [$b, $c]],
        ];

        /*
         * A pair that must stay together rules out the splits that break them
         * up. With one such pair among four players exactly one split survives,
         * which is the whole point: they keep playing together.
         *
         * If nothing survives the filter the constraint was self-contradictory,
         * so it is dropped rather than leaving the court without a match.
         */
        if ($keepTogether !== []) {
            $required = array_map(fn (array $pair) => $this->pairKey($pair[0], $pair[1]), $keepTogether);

            $viable = array_values(array_filter($splits, function (array $split) use ($required): bool {
                $made = array_map(
                    fn (array $team) => $this->pairKey($team[0]['player_id'], $team[1]['player_id']),
                    $split,
                );

                foreach ($required as $key) {
                    if (! in_array($key, $made, true)) {
                        return false;
                    }
                }

                return true;
            }));

            if ($viable !== []) {
                $splits = $viable;
            }
        }

        $best = null;
        $bestScore = null;

        foreach ($splits as [$one, $two]) {
            $score = $this->pairingScore($one, $two, $history);

            if ($bestScore === null || $score < $bestScore) {
                $bestScore = $score;
                $best = ['score' => $score, 'one' => $one, 'two' => $two];
            }
        }

        return $best;
    }

    /**
     * @param  array<int, array{player_id:int, rating:float}>  $one
     * @param  array<int, array{player_id:int, rating:float}>  $two
     * @param  array{partners: array<string,int>, opponents: array<string,int>}  $history
     */
    private function pairingScore(array $one, array $two, array $history): float
    {
        $score = 0.0;

        foreach ([$one, $two] as $team) {
            /* Singles has no partner to have played with before. */
            if (count($team) < 2) {
                continue;
            }

            $key = $this->pairKey($team[0]['player_id'], $team[1]['player_id']);
            $score += self::PARTNER_PENALTY * ($history['partners'][$key] ?? 0);
        }

        foreach ($one as $left) {
            foreach ($two as $right) {
                $key = $this->pairKey($left['player_id'], $right['player_id']);
                $score += self::OPPONENT_PENALTY * ($history['opponents'][$key] ?? 0);
            }
        }

        /* Rule 7. Only bites when ratings actually differ, so an unrated club
           is scored purely on partner and opponent variety. */
        $oneRating = array_sum(array_column($one, 'rating'));
        $twoRating = array_sum(array_column($two, 'rating'));
        $score += self::IMBALANCE_PENALTY * abs($oneRating - $twoRating);

        return $score;
    }

    /* ------------------------------------------------------------------ */
    /* Creation */
    /* ------------------------------------------------------------------ */

    /**
     * @param  Collection<int, array{player_id:int, rating:float}>  $four
     * @param  array{partners: array<string,int>, opponents: array<string,int>}  $history
     * @param  array<int, array{0:int, 1:int}>  $keepTogether  pairs already on this court together
     */
    private function createMatch(
        OpenPlaySession $session,
        Court $court,
        Collection $four,
        array &$history,
        int $round,
        array $keepTogether = [],
    ): OpenPlayMatch {
        $pairing = $this->bestPairing($four, $history, $keepTogether);

        $names = Player::query()
            ->whereIn('id', $four->pluck('player_id'))
            ->pluck('name', 'id');

        $label = fn (array $team) => collect($team)
            ->map(fn (array $entry) => (string) ($names[$entry['player_id']] ?? 'Player'))
            ->implode(' / ');

        $clubMatch = ClubMatch::query()->create([
            'organization_id' => $session->organization_id,
            'branch_id' => $session->branch_id,
            'court_id' => $court->id,
            'match_type' => $session->format === 'singles' ? 'singles' : 'doubles',
            /* The session decides what a win is, not the column default. */
            'target_score' => $session->target_score,
            'win_by_two' => $session->win_by_two,
            'team_one_name' => $label($pairing['one']),
            'team_two_name' => $label($pairing['two']),
            'serving_team' => 'team_one',
            'serving_number' => $session->format === 'singles' ? null : 2,
            'status' => 'live',
            'started_at' => now(),
            'notes' => "Open play {$session->session_code} · round {$round}",
        ]);

        MatchGame::query()->create([
            'organization_id' => $session->organization_id,
            'club_match_id' => $clubMatch->id,
            'game_number' => 1,
            'started_at' => now(),
        ]);

        $openPlayMatch = OpenPlayMatch::query()->create([
            'organization_id' => $session->organization_id,
            'open_play_session_id' => $session->id,
            'club_match_id' => $clubMatch->id,
            'court_id' => $court->id,
            'round' => $round,
            'status' => 'live',
        ]);

        foreach (['one' => $pairing['one'], 'two' => $pairing['two']] as $team => $members) {
            foreach ($members as $member) {
                OpenPlayMatchPlayer::query()->create([
                    'organization_id' => $session->organization_id,
                    'open_play_match_id' => $openPlayMatch->id,
                    'player_id' => $member['player_id'],
                    'team' => $team,
                ]);
            }
        }

        $this->markPlaying($session, $four->pluck('player_id')->all(), $court->id);

        /* Fold this match into the running history so the next court in the
           same round does not repeat the pairing we just made. */
        $this->recordHistory($history, $pairing);

        return $openPlayMatch->load(['court', 'participants.player', 'clubMatch']);
    }

    /**
     * Teams from the finished match whose members are all staying on.
     *
     * A team only survives if both of its players held the court. One of a pair
     * rotating off leaves the other free to be paired with whoever comes on,
     * which is what should happen — there is no team left to keep.
     *
     * @param  array<int, int>  $staying
     * @return array<int, array{0:int, 1:int}>
     */
    private function pairsStayingOn(OpenPlayMatch $match, array $staying): array
    {
        if (count($staying) < 2) {
            return [];
        }

        return $match->participants()
            ->get(['player_id', 'team'])
            ->groupBy('team')
            ->map(fn (Collection $members) => $members
                ->pluck('player_id')
                ->map(fn ($id) => (int) $id)
                ->intersect($staying)
                ->values()
                ->all())
            ->filter(fn (array $members) => count($members) === 2)
            ->values()
            ->all();
    }

    /**
     * @param  array{partners: array<string,int>, opponents: array<string,int>}  $history
     * @param  array{one: array<int, array>, two: array<int, array>}  $pairing
     */
    private function recordHistory(array &$history, array $pairing): void
    {
        foreach ([$pairing['one'], $pairing['two']] as $team) {
            /* Singles has no partners to remember. */
            if (count($team) < 2) {
                continue;
            }

            $key = $this->pairKey($team[0]['player_id'], $team[1]['player_id']);
            $history['partners'][$key] = ($history['partners'][$key] ?? 0) + 1;
        }

        foreach ($pairing['one'] as $left) {
            foreach ($pairing['two'] as $right) {
                $key = $this->pairKey($left['player_id'], $right['player_id']);
                $history['opponents'][$key] = ($history['opponents'][$key] ?? 0) + 1;
            }
        }
    }

    /** @param  array<int, int>  $playerIds */
    private function markPlaying(OpenPlaySession $session, array $playerIds, int $courtId): void
    {
        $now = now();

        /* Going on court banks however long they stood in the queue and starts
           the clock on this stint. `completeMatch` has usually done this
           already; `generate` filling a cold court is the path that has not. */
        foreach (OpenPlayQueueEntry::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->whereIn('player_id', $playerIds)
            ->get() as $entry) {
            $waited = $entry->queue_entered_at ? (int) $now->diffInSeconds($entry->queue_entered_at, true) : 0;

            $entry->update([
                'status' => OpenPlayQueueEntry::ON_COURT,
                'assigned_court_id' => $courtId,
                'called_at' => $now,
                'court_entered_at' => $entry->court_entered_at ?? $now,
                'queue_entered_at' => null,
                'total_waiting_seconds' => $entry->total_waiting_seconds + $waited,
            ]);
        }

        OpenPlayPlayer::query()
            ->where('open_play_session_id', $session->id)
            ->whereIn('player_id', $playerIds)
            ->update(['status' => 'playing']);
    }

    /* ------------------------------------------------------------------ */
    /* Helpers */
    /* ------------------------------------------------------------------ */

    /**
     * @param  array<int, int>  $members
     * @return array<int, string>
     */
    private function pairs(array $members): array
    {
        $keys = [];

        for ($i = 0; $i < count($members); $i++) {
            for ($j = $i + 1; $j < count($members); $j++) {
                $keys[] = $this->pairKey($members[$i], $members[$j]);
            }
        }

        return $keys;
    }

    private function pairKey(int $a, int $b): string
    {
        return $a < $b ? "{$a}-{$b}" : "{$b}-{$a}";
    }
}
