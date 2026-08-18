<?php

namespace App\Services;

use App\Models\Player;
use App\Models\PlayerProfile;
use App\Models\PlayerRanking;
use Illuminate\Support\Collection;

class PlayerRankingService
{
    public function __construct(private readonly MatchResultService $results) {}

    /**
     * Rebuild club rankings from games actually played.
     *
     * These numbers used to be invented: wins were `total_reservations * 0.58`,
     * which is a fraction of how often someone booked a court and has nothing
     * to do with whether they won anything. A player who booked twenty courts
     * and lost every game outranked one who turned up once and won.
     *
     * They now come from recorded match results. Players with no completed
     * games are still ranked, on rating, with a clean zero record rather than a
     * fabricated one.
     */
    public function refresh(?int $organizationId = null): void
    {
        $tally = $this->results->tallyByPlayer($organizationId);

        $players = Player::query()
            ->when($organizationId, fn ($query) => $query->where('organization_id', $organizationId))
            ->get()
            ->sortByDesc(fn (Player $player) => [
                $tally[$player->id]['wins'] ?? 0,
                (float) $player->rating,
            ])
            ->values();

        foreach ($players as $index => $player) {
            $row = $tally[$player->id] ?? ['games' => 0, 'wins' => 0, 'losses' => 0, 'points_for' => 0, 'points_against' => 0];

            PlayerRanking::query()->updateOrCreate(
                [
                    'organization_id' => $player->organization_id,
                    'player_id' => $player->id,
                    'division' => 'club',
                ],
                [
                    'rank' => $index + 1,
                    'rating' => $player->rating,
                    'wins' => $row['wins'],
                    'losses' => $row['losses'],
                    'points_for' => $row['points_for'],
                    'points_against' => $row['points_against'],
                    'ranked_at' => now(),
                ],
            );
        }
    }

    public function globalRankings(int $limit = 100): Collection
    {
        return PlayerProfile::query()
            ->where('status', 'active')
            ->orderByDesc('global_rating')
            ->orderByDesc('wins')
            ->orderByDesc('global_match_count')
            ->limit($limit)
            ->get()
            ->values()
            ->map(fn (PlayerProfile $profile, int $index) => [
                'rank' => $index + 1,
                'courtprime_player_id' => $profile->courtprime_player_id,
                'display_name' => $profile->display_name,
                'avatar_url' => $profile->avatar_url,
                'skill_level' => $profile->skill_level,
                'rating' => $profile->global_rating,
                'matches' => $profile->global_match_count,
                'wins' => $profile->wins,
                'losses' => $profile->losses,
                'win_percent' => ($profile->wins + $profile->losses) > 0
                    ? round(($profile->wins / ($profile->wins + $profile->losses)) * 100, 1)
                    : 0,
                'verification_status' => $profile->verification_status,
            ]);
    }
}
