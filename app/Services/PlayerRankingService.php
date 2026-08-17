<?php

namespace App\Services;

use App\Models\Player;
use App\Models\PlayerProfile;
use App\Models\PlayerRanking;
use Illuminate\Support\Collection;

class PlayerRankingService
{
    public function refresh(?int $organizationId = null): void
    {
        $players = Player::query()
            ->when($organizationId, fn ($query) => $query->where('organization_id', $organizationId))
            ->orderByDesc('rating')
            ->orderByDesc('total_reservations')
            ->get();

        foreach ($players as $index => $player) {
            PlayerRanking::query()->updateOrCreate(
                [
                    'organization_id' => $player->organization_id,
                    'player_id' => $player->id,
                    'division' => 'club',
                ],
                [
                    'rank' => $index + 1,
                    'rating' => $player->rating,
                    'wins' => max((int) floor($player->total_reservations * 0.58), 0),
                    'losses' => max((int) floor($player->total_reservations * 0.42), 0),
                    'points_for' => $player->total_reservations * 11,
                    'points_against' => $player->total_reservations * 8,
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
