<?php

namespace App\Services;

use App\Models\ClubMatch;
use App\Models\MatchGame;
use App\Models\ScoreEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MatchScoringService
{
    public function increment(ClubMatch $match, string $team, ?int $userId = null): ClubMatch
    {
        if (! in_array($team, ['team_one', 'team_two'], true)) {
            throw ValidationException::withMessages(['team' => 'Invalid scoring team.']);
        }

        if ($match->status === 'completed') {
            throw ValidationException::withMessages(['match' => 'Completed matches cannot be scored.']);
        }

        return DB::transaction(function () use ($match, $team, $userId) {
            $match = ClubMatch::query()->lockForUpdate()->findOrFail($match->id);
            $servingTeam = $this->servingTeam($match);
            $servingNumber = $this->servingNumber($match);
            $previous = $this->state($match);

            $teamOneScore = (int) $match->team_one_score;
            $teamTwoScore = (int) $match->team_two_score;
            $nextServingTeam = $servingTeam;
            $nextServingNumber = $servingNumber;
            $pointScored = $team === $servingTeam;

            if ($pointScored) {
                $teamOneScore += $team === 'team_one' ? 1 : 0;
                $teamTwoScore += $team === 'team_two' ? 1 : 0;
            } elseif ($this->isDoubles($match)) {
                if ($servingNumber === 1) {
                    $nextServingNumber = 2;
                } else {
                    $nextServingTeam = $team;
                    $nextServingNumber = 1;
                }
            } else {
                $nextServingTeam = $team;
                $nextServingNumber = null;
            }

            $winner = $this->winner($match, $teamOneScore, $teamTwoScore);

            $match->update([
                'team_one_score' => $teamOneScore,
                'team_two_score' => $teamTwoScore,
                'serving_team' => $nextServingTeam,
                'serving_number' => $this->isDoubles($match) ? $nextServingNumber : null,
                'status' => $winner ? 'completed' : 'live',
                'ended_at' => $winner ? now() : null,
            ]);

            $this->game($match)->update([
                'team_one_score' => $teamOneScore,
                'team_two_score' => $teamTwoScore,
                'winner_team' => $winner,
                'ended_at' => $winner ? now() : null,
            ]);

            ScoreEvent::query()->create([
                'organization_id' => $match->organization_id,
                'club_match_id' => $match->id,
                'recorded_by' => $userId,
                'event_type' => $pointScored ? ($winner ? 'match_point' : 'score_increment') : 'serve_rotation',
                'team' => $team,
                'team_one_score' => $teamOneScore,
                'team_two_score' => $teamTwoScore,
                'payload' => [
                    'winner_team' => $winner,
                    'rally_winner' => $team,
                    'point_scored' => $pointScored,
                    'previous' => $previous,
                    'next' => $this->state($match->fresh()),
                ],
            ]);

            return $match->refresh();
        });
    }

    /**
     * Put the game back to nil all.
     *
     * For a court whose teams have just changed: the points on the board were
     * won by pairs that no longer exist, so carrying them over would credit
     * them to people who did not win them. The game restarts, which is what
     * happens on the court when partners swap.
     *
     * The points already scored stay in `score_events` - this adds to that
     * history rather than deleting it, so what happened is still answerable.
     */
    public function reset(ClubMatch $match, ?int $userId = null): ClubMatch
    {
        return DB::transaction(function () use ($match, $userId) {
            $match = ClubMatch::query()->lockForUpdate()->findOrFail($match->id);

            $match->update([
                'team_one_score' => 0,
                'team_two_score' => 0,
                'serving_team' => 'team_one',
                'serving_number' => $this->isDoubles($match) ? 2 : null,
                'status' => 'live',
                'ended_at' => null,
            ]);

            $this->game($match)->update([
                'team_one_score' => 0,
                'team_two_score' => 0,
                'winner_team' => null,
                'ended_at' => null,
            ]);

            ScoreEvent::query()->create([
                'organization_id' => $match->organization_id,
                'club_match_id' => $match->id,
                'recorded_by' => $userId,
                'event_type' => 'score_reset',
                'team' => null,
                'team_one_score' => 0,
                'team_two_score' => 0,
                'payload' => [
                    'reason' => 'teams_changed',
                    'next' => $this->state($match->fresh()),
                ],
            ]);

            return $match->refresh();
        });
    }

    /**
     * Take back a rally.
     *
     * With a team, it takes back that team's last won rally. Without one, it
     * takes back the match's last rally, whether it scored a point or only
     * moved the serve.
     */
    public function undo(ClubMatch $match, ?int $userId = null, ?string $team = null): ClubMatch
    {
        return DB::transaction(function () use ($match, $userId, $team) {
            $match = ClubMatch::query()->lockForUpdate()->findOrFail($match->id);

            $last = ScoreEvent::query()
                ->where('club_match_id', $match->id)
                ->whereIn('event_type', ['score_increment', 'match_point', 'serve_rotation'])
                ->when($team, fn ($query) => $query->where('team', $team))
                ->latest('id')
                ->first();
            $latestRally = ScoreEvent::query()
                ->where('club_match_id', $match->id)
                ->whereIn('event_type', ['score_increment', 'match_point', 'serve_rotation'])
                ->latest('id')
                ->first();

            if (! $last) {
                throw ValidationException::withMessages([
                    'match' => $team ? 'That team has no rally to take back.' : 'No score event to undo.',
                ]);
            }

            $previous = is_array($last->payload) ? ($last->payload['previous'] ?? null) : null;
            $useSnapshot = is_array($previous) && $latestRally?->id === $last->id;
            $pointScored = is_array($last->payload) ? (bool) ($last->payload['point_scored'] ?? true) : $last->event_type !== 'serve_rotation';
            $teamOneScore = $useSnapshot
                ? (int) $previous['team_one_score']
                : max((int) $match->team_one_score - ($pointScored && $last->team === 'team_one' ? 1 : 0), 0);
            $teamTwoScore = $useSnapshot
                ? (int) $previous['team_two_score']
                : max((int) $match->team_two_score - ($pointScored && $last->team === 'team_two' ? 1 : 0), 0);

            $match->update([
                'team_one_score' => $teamOneScore,
                'team_two_score' => $teamTwoScore,
                'serving_team' => $useSnapshot ? ($previous['serving_team'] ?? $this->servingTeam($match)) : $this->servingTeam($match),
                'serving_number' => $this->isDoubles($match)
                    ? ($useSnapshot ? ($previous['serving_number'] ?? $this->servingNumber($match)) : $this->servingNumber($match))
                    : null,
                'status' => 'live',
                'ended_at' => null,
            ]);

            $this->game($match)->update([
                'team_one_score' => $teamOneScore,
                'team_two_score' => $teamTwoScore,
                'winner_team' => null,
                'ended_at' => null,
            ]);

            ScoreEvent::query()->create([
                'organization_id' => $match->organization_id,
                'club_match_id' => $match->id,
                'recorded_by' => $userId,
                'event_type' => 'undo',
                'team' => $last->team,
                'team_one_score' => $teamOneScore,
                'team_two_score' => $teamTwoScore,
                'payload' => [
                    'undone_event_id' => $last->id,
                    'previous' => $previous,
                    'next' => $this->state($match->fresh()),
                ],
            ]);

            return $match->refresh();
        });
    }

    private function game(ClubMatch $match): MatchGame
    {
        return MatchGame::query()->firstOrCreate(
            ['club_match_id' => $match->id, 'game_number' => $match->game_number],
            [
                'organization_id' => $match->organization_id,
                'team_one_score' => $match->team_one_score,
                'team_two_score' => $match->team_two_score,
                'started_at' => $match->started_at ?? now(),
            ],
        );
    }

    private function winner(ClubMatch $match, int $teamOneScore, int $teamTwoScore): ?string
    {
        $target = $match->target_score;

        if ($teamOneScore < $target && $teamTwoScore < $target) {
            return null;
        }

        if ($match->win_by_two && abs($teamOneScore - $teamTwoScore) < 2) {
            return null;
        }

        return $teamOneScore > $teamTwoScore ? 'team_one' : 'team_two';
    }

    private function servingTeam(ClubMatch $match): string
    {
        return in_array($match->serving_team, ['team_one', 'team_two'], true) ? $match->serving_team : 'team_one';
    }

    private function servingNumber(ClubMatch $match): int
    {
        $number = (int) ($match->serving_number ?? 0);

        if (in_array($number, [1, 2], true)) {
            return $number;
        }

        return (int) $match->team_one_score === 0 && (int) $match->team_two_score === 0 && $this->servingTeam($match) === 'team_one' ? 2 : 1;
    }

    private function isDoubles(ClubMatch $match): bool
    {
        return $match->match_type !== 'singles';
    }

    /** @return array<string, int|string|null> */
    private function state(ClubMatch $match): array
    {
        return [
            'team_one_score' => (int) $match->team_one_score,
            'team_two_score' => (int) $match->team_two_score,
            'serving_team' => $this->servingTeam($match),
            'serving_number' => $this->isDoubles($match) ? $this->servingNumber($match) : null,
            'serve_call' => $this->serveCall($match),
        ];
    }

    private function serveCall(ClubMatch $match): string
    {
        $servingTeam = $this->servingTeam($match);
        $serverScore = $servingTeam === 'team_one' ? (int) $match->team_one_score : (int) $match->team_two_score;
        $receiverScore = $servingTeam === 'team_one' ? (int) $match->team_two_score : (int) $match->team_one_score;

        if (! $this->isDoubles($match)) {
            return "{$serverScore}-{$receiverScore}";
        }

        return "{$serverScore}-{$receiverScore}-{$this->servingNumber($match)}";
    }
}
