<?php

namespace App\Services;

use App\Models\ClubMatch;
use App\Models\OpenPlayMatch;
use App\Models\OrganizationPlayer;
use App\Models\Player;
use App\Models\PlayerProfile;
use App\Support\PublicPlayerName;
use Illuminate\Support\Collection;

/**
 * Who is on court, as a public screen may show them.
 *
 * Both boards need the same answer — the branch scoreboard bolted to one wall
 * and the club-wide live display — and both are unauthenticated, so the rule
 * about what may leave the building is written once here rather than twice in
 * two controllers that could drift apart.
 *
 * `club_matches` carries the score but names its teams as free text, so the
 * people behind those names come from the open play rotation that generated the
 * match. A match with no rotation behind it still scores perfectly well; the
 * caller falls back to showing the team names instead of faces.
 */
class ScoreboardLineupService
{
    /**
     * The people on each live match, keyed by club match id.
     *
     * Three queries for the whole board however many courts it has: the
     * rotation rows for every live match, the club-side player records behind
     * them, then the network profiles those map to. Doing it per court would be
     * three queries per court on a screen that reloads every few seconds.
     *
     * @param  Collection<int, ClubMatch>  $matches
     * @return array<int, array{one: array<int, array<string, mixed>>, two: array<int, array<string, mixed>>}>
     */
    public function forMatches(Collection $matches): array
    {
        if ($matches->isEmpty()) {
            return [];
        }

        $openPlayMatches = OpenPlayMatch::query()
            ->withoutGlobalScope('organization')
            ->with('participants')
            ->whereIn('club_match_id', $matches->pluck('id'))
            ->get();

        if ($openPlayMatches->isEmpty()) {
            return [];
        }

        $players = $this->playersById(
            $openPlayMatches
                ->flatMap(fn (OpenPlayMatch $match) => $match->participants->pluck('player_id'))
                ->filter()
                ->unique()
                ->values()
        );

        $lineups = [];

        foreach ($openPlayMatches as $openPlayMatch) {
            $sides = ['one' => [], 'two' => []];

            foreach ($openPlayMatch->participants as $participant) {
                $player = $players->get($participant->player_id);

                if (! $player) {
                    continue;
                }

                $sides[$participant->team === 'two' ? 'two' : 'one'][] = $player;
            }

            $lineups[$openPlayMatch->club_match_id] = $sides;
        }

        return $lineups;
    }

    /**
     * Club-side player records resolved to what a screen may show.
     *
     * The portrait and the stated gender live on the network profile, which is
     * reached through the club's roster row, so the two are looked up together
     * and handed back keyed by the club-side id the rotation refers to.
     *
     * @param  Collection<int, int>  $playerIds
     * @return Collection<int, array<string, mixed>>
     */
    public function playersById(Collection $playerIds): Collection
    {
        if ($playerIds->isEmpty()) {
            return collect();
        }

        $players = Player::query()
            ->withoutGlobalScope('organization')
            ->whereIn('id', $playerIds)
            ->get(['id', 'name', 'rating', 'skill_level']);

        /* legacy player id → network profile, for photos and stated gender. */
        $profiles = OrganizationPlayer::query()
            ->withoutGlobalScope('organization')
            ->with('playerProfile')
            ->whereIn('legacy_player_id', $playerIds)
            ->get()
            ->keyBy('legacy_player_id');

        return $players->mapWithKeys(function (Player $player) use ($profiles) {
            $profile = $profiles->get($player->id)?->playerProfile;

            return [$player->id => $this->publicPlayer($player, $profile)];
        });
    }

    /**
     * What an anonymous screen in a public room is allowed to know about
     * somebody: a short name, how they play, and a portrait they chose.
     *
     * No contact details, no money, no booking references, no id that reaches
     * anything else. This is the whole of it — anything added here is added to
     * a TV that strangers walk past.
     *
     * @return array<string, mixed>
     */
    public function publicPlayer(Player $player, ?PlayerProfile $profile): array
    {
        [$first, $initial] = PublicPlayerName::parts($profile?->display_name ?? $player->name);

        return [
            'id' => $player->id,
            /* Split, because the board sets the first name large and the
               initial small beside it. */
            'first_name' => $first ?? 'Player',
            'last_initial' => $initial,
            'rating' => $player->rating !== null ? (float) $player->rating : null,
            'skill_level' => $player->skill_level,
            /*
             * Stated gender only, never inferred from the name: it selects which
             * set of CourtPrime portraits stands in for a player who uploaded
             * none, and a wrong guess misgenders someone on a wall display.
             */
            'gender' => $profile?->gender,
            /* Empty when they have uploaded nothing, and the board falls back to
               the defaults for their gender. */
            'photos' => $profile?->portrait_urls ?? [],
        ];
    }
}
