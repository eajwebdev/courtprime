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
            $teamOneScore = $match->team_one_score + ($team === 'team_one' ? 1 : 0);
            $teamTwoScore = $match->team_two_score + ($team === 'team_two' ? 1 : 0);
            $winner = $this->winner($match, $teamOneScore, $teamTwoScore);

            $match->update([
                'team_one_score' => $teamOneScore,
                'team_two_score' => $teamTwoScore,
                'serving_team' => $team,
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
                'event_type' => $winner ? 'match_point' : 'score_increment',
                'team' => $team,
                'team_one_score' => $teamOneScore,
                'team_two_score' => $teamTwoScore,
                'payload' => ['winner_team' => $winner],
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
     * The points already scored stay in `score_events` — this adds to that
     * history rather than deleting it, so what happened is still answerable.
     */
    public function reset(ClubMatch $match, ?int $userId = null): ClubMatch
    {
        return DB::transaction(function () use ($match, $userId) {
            $match->update([
                'team_one_score' => 0,
                'team_two_score' => 0,
                /* Back to the first serve of a game, which is the column's own
                   default — it is not nullable, and a restarted game has to
                   hand the serve to somebody. */
                'serving_team' => 'team_one',
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
                'payload' => ['reason' => 'teams_changed'],
            ]);

            return $match->refresh();
        });
    }

    /**
     * Take back a point.
     *
     * With a team, it takes back that team's last point. Without one, the
     * match's last point, whoever scored it.
     *
     * The team matters. The open play board undoes by double tapping the half
     * you tapped by mistake, and without this it removed whichever point was
     * scored most recently: double tapping your own half took a point off the
     * other side whenever they had scored last.
     */
    public function undo(ClubMatch $match, ?int $userId = null, ?string $team = null): ClubMatch
    {
        return DB::transaction(function () use ($match, $userId, $team) {
            $last = ScoreEvent::query()
                ->where('club_match_id', $match->id)
                ->whereIn('event_type', ['score_increment', 'match_point'])
                ->when($team, fn ($query) => $query->where('team', $team))
                /* By id, not by timestamp: two points in the same second are
                   otherwise ordered arbitrarily. */
                ->latest('id')
                ->first();

            if (! $last) {
                throw ValidationException::withMessages([
                    'match' => $team ? 'That team has no point to take back.' : 'No score event to undo.',
                ]);
            }

            $teamOneScore = max($match->team_one_score - ($last->team === 'team_one' ? 1 : 0), 0);
            $teamTwoScore = max($match->team_two_score - ($last->team === 'team_two' ? 1 : 0), 0);

            $match->update([
                'team_one_score' => $teamOneScore,
                'team_two_score' => $teamTwoScore,
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
                'payload' => ['undone_event_id' => $last->id],
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
}
