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
 *   4. partners are varied
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

            if ($available->count() < 4) {
                return collect();
            }

            $history = $this->history($session);
            $round = (int) $session->current_round + 1;
            $created = collect();

            foreach ($freeCourts as $court) {
                if ($available->count() < 4) {
                    break;
                }

                $four = $this->pickFour($available, $history);
                $available = $available->reject(fn (array $entry) => in_array($entry['player_id'], $four->pluck('player_id')->all(), true))->values();

                $created->push($this->createMatch($session, $court, $four, $history, $round));
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
     * @return Collection<int, OpenPlayMatch>
     */
    public function completeMatch(OpenPlayMatch $match): Collection
    {
        DB::transaction(function () use ($match) {
            $match->update(['status' => 'completed', 'completed_at' => now()]);

            /* Back to waiting, at the tail, so the queue reflects reality. */
            $playerIds = $match->participants()->pluck('player_id')->all();

            $tail = (int) OpenPlayQueueEntry::query()
                ->where('open_play_session_id', $match->open_play_session_id)
                ->max('position');

            foreach ($playerIds as $index => $playerId) {
                OpenPlayQueueEntry::query()
                    ->where('open_play_session_id', $match->open_play_session_id)
                    ->where('player_id', $playerId)
                    ->update([
                        'status' => 'waiting',
                        'assigned_court_id' => null,
                        'position' => $tail + $index + 1,
                    ]);

                OpenPlayPlayer::query()
                    ->where('open_play_session_id', $match->open_play_session_id)
                    ->where('player_id', $playerId)
                    ->update(['status' => 'checked_in']);
            }
        });

        return $this->generate($match->session);
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
            ->whereIn('status', ['waiting', 'called'])
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
    private function pickFour(Collection $available, array $history): Collection
    {
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
     * @param  Collection<int, array{player_id:int, rating:float}>  $quartet
     * @param  array{partners: array<string,int>, opponents: array<string,int>}  $history
     * @return array{score: float, one: array<int, array>, two: array<int, array>}
     */
    private function bestPairing(Collection $quartet, array $history): array
    {
        $players = $quartet->values()->all();

        if (count($players) < 4) {
            return ['score' => 0.0, 'one' => array_slice($players, 0, 2), 'two' => array_slice($players, 2)];
        }

        [$a, $b, $c, $d] = $players;

        $splits = [
            [[$a, $b], [$c, $d]],
            [[$a, $c], [$b, $d]],
            [[$a, $d], [$b, $c]],
        ];

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
        $oneRating = $one[0]['rating'] + $one[1]['rating'];
        $twoRating = $two[0]['rating'] + $two[1]['rating'];
        $score += self::IMBALANCE_PENALTY * abs($oneRating - $twoRating);

        return $score;
    }

    /* ------------------------------------------------------------------ */
    /* Creation */
    /* ------------------------------------------------------------------ */

    /**
     * @param  Collection<int, array{player_id:int, rating:float}>  $four
     * @param  array{partners: array<string,int>, opponents: array<string,int>}  $history
     */
    private function createMatch(OpenPlaySession $session, Court $court, Collection $four, array &$history, int $round): OpenPlayMatch
    {
        $pairing = $this->bestPairing($four, $history);

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
            'match_type' => 'doubles',
            'team_one_name' => $label($pairing['one']),
            'team_two_name' => $label($pairing['two']),
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
     * @param  array{partners: array<string,int>, opponents: array<string,int>}  $history
     * @param  array{one: array<int, array>, two: array<int, array>}  $pairing
     */
    private function recordHistory(array &$history, array $pairing): void
    {
        foreach ([$pairing['one'], $pairing['two']] as $team) {
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
        OpenPlayQueueEntry::query()
            ->where('open_play_session_id', $session->id)
            ->whereIn('player_id', $playerIds)
            ->update(['status' => 'called', 'assigned_court_id' => $courtId, 'called_at' => now()]);

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
