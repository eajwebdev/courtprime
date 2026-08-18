<?php

namespace App\Services;

use App\Models\ClubMatch;
use App\Models\OpenPlayMatch;
use App\Models\OrganizationPlayer;
use App\Models\Player;
use App\Models\PlayerProfile;
use Illuminate\Support\Facades\DB;

/**
 * Turning a finished game into a player's record.
 *
 * Results used to stop at the match. `open_play_matches.winner_team` was set,
 * the scores were saved, the session standings read from them, and that was the
 * end of it: nothing touched the player. Win ten open play games and your
 * profile, your club ranking and the leaderboards all still showed nothing.
 *
 * This is the step that was missing. It runs inside the transaction that marks
 * the match completed, so a game is counted exactly once even if two people tap
 * Finish at the same moment.
 */
class MatchResultService
{
    /**
     * Credit every player in an open play match with the result.
     *
     * A draw, which the board allows when nobody is ahead, counts as a game
     * played for everyone and a win for no one.
     */
    public function recordOpenPlay(OpenPlayMatch $match): void
    {
        $participants = $match->participants()->get(['player_id', 'team']);

        if ($participants->isEmpty()) {
            return;
        }

        $winner = $match->winner_team;
        $playerIds = $participants->pluck('player_id')->all();

        /*
         * The org-local Player is not the identity. Wins belong to the
         * CourtPrime profile behind it, which is what the leaderboards and the
         * player's own card read, so the join goes through OrganizationPlayer.
         */
        $profileIds = OrganizationPlayer::query()
            ->withoutGlobalScope('organization')
            ->whereIn('legacy_player_id', $playerIds)
            ->pluck('player_profile_id', 'legacy_player_id');

        foreach ($participants as $participant) {
            $won = $winner !== null && $participant->team === $winner;
            $profileId = $profileIds[$participant->player_id] ?? null;

            if ($profileId) {
                PlayerProfile::query()->whereKey($profileId)->update([
                    'global_match_count' => DB::raw('global_match_count + 1'),
                    'wins' => DB::raw('wins + '.($won ? 1 : 0)),
                    'losses' => DB::raw('losses + '.($won || $winner === null ? 0 : 1)),
                ]);
            }
        }

        /* Their last game, for the club's own "who is active" reporting. */
        Player::query()
            ->withoutGlobalScope('organization')
            ->whereIn('id', $playerIds)
            ->update(['last_played_at' => now()]);
    }

    /**
     * Wins, losses and points for every player, from matches actually played.
     *
     * Counted from open play, which is where results are recorded today. Other
     * match types can join this union as they start writing winners.
     *
     * @return array<int, array{games:int, wins:int, losses:int, points_for:int, points_against:int}>
     */
    public function tallyByPlayer(?int $organizationId = null): array
    {
        return DB::table('open_play_match_players as p')
            ->join('open_play_matches as m', 'm.id', '=', 'p.open_play_match_id')
            ->leftJoin('club_matches as c', 'c.id', '=', 'm.club_match_id')
            ->where('m.status', 'completed')
            ->when($organizationId, fn ($query) => $query->where('p.organization_id', $organizationId))
            ->groupBy('p.player_id')
            ->selectRaw('p.player_id')
            ->selectRaw('COUNT(*) as games')
            ->selectRaw('SUM(CASE WHEN m.winner_team IS NOT NULL AND m.winner_team = p.team THEN 1 ELSE 0 END) as wins')
            ->selectRaw('SUM(CASE WHEN m.winner_team IS NOT NULL AND m.winner_team <> p.team THEN 1 ELSE 0 END) as losses')
            ->selectRaw("SUM(CASE WHEN p.team = 'one' THEN COALESCE(c.team_one_score, 0) ELSE COALESCE(c.team_two_score, 0) END) as points_for")
            ->selectRaw("SUM(CASE WHEN p.team = 'one' THEN COALESCE(c.team_two_score, 0) ELSE COALESCE(c.team_one_score, 0) END) as points_against")
            ->get()
            ->mapWithKeys(fn ($row) => [(int) $row->player_id => [
                'games' => (int) $row->games,
                'wins' => (int) $row->wins,
                'losses' => (int) $row->losses,
                'points_for' => (int) $row->points_for,
                'points_against' => (int) $row->points_against,
            ]])
            ->all();
    }

    /** Kept for the club match path, which records a winning player rather than a team. */
    public function recordClubMatch(ClubMatch $match): void
    {
        if (! $match->winner_player_id) {
            return;
        }

        Player::query()
            ->withoutGlobalScope('organization')
            ->whereKey($match->winner_player_id)
            ->update(['last_played_at' => now()]);
    }
}
