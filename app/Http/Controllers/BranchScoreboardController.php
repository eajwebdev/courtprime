<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\ClubMatch;
use App\Models\Court;
use App\Models\OpenPlayMatch;
use App\Models\OpenPlayQueueEntry;
use App\Models\OpenPlaySession;
use App\Models\OrganizationPlayer;
use App\Models\Player;
use App\Models\PlayerProfile;
use App\Support\NetworkClock;
use App\Support\PublicPlayerName;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * One branch's courtside screen.
 *
 * The board bolted to the wall at a single venue: who is on which court, what
 * the score is, and who is waiting. Scoped to a branch rather than to the whole
 * club, because a screen hangs in one room and the courts in the next city are
 * noise on it.
 *
 * Public and unauthenticated by design — it runs on a smart TV nobody logs into.
 * What it may show is bounded accordingly: a short name, a portrait the player
 * chose, and a score. No contact details, no money, no booking references.
 *
 * `club_matches` carries the score but names its teams as free text, so the
 * people behind those names come from the open play rotation that generated the
 * match. A match with no rotation behind it still scores perfectly well; it
 * falls back to showing its team names instead of faces.
 */
class BranchScoreboardController extends Controller
{
    public function __invoke(Request $request, Branch $branch): Response
    {
        $branch->loadMissing('organization');

        $this->authorizeDisplayAccess($request, $branch);

        $courts = Court::query()
            ->withoutGlobalScope('organization')
            ->where('branch_id', $branch->id)
            ->orderBy('court_number')
            ->get();

        $liveMatches = ClubMatch::query()
            ->withoutGlobalScope('organization')
            ->whereIn('court_id', $courts->pluck('id'))
            ->where('status', 'live')
            ->orderByDesc('started_at')
            ->get()
            ->groupBy('court_id');

        $lineups = $this->lineups($liveMatches->flatten());
        $settings = $branch->organization?->settings ?? [];

        return Inertia::render('branch-scoreboard', [
            'branch' => [
                'id' => $branch->id,
                'name' => $branch->name,
                'address' => $branch->address,
                'organization' => $branch->organization?->name,
            ],
            'display' => [
                'brand' => $settings['live_display_branding'] ?? $branch->organization?->name ?? 'CourtPrime',
                'logo_url' => $settings['logo_url'] ?? null,
                'announcement' => $settings['live_display_announcement'] ?? null,
                /* How long one portrait holds before the next. */
                'portrait_seconds' => max((int) ($settings['scoreboard_portrait_seconds'] ?? 10), 4),
            ],
            'courts' => $courts
                ->map(fn (Court $court) => $this->court($court, $liveMatches->get($court->id)?->first(), $lineups))
                ->values(),
            'waiting' => $this->waiting($branch),
            'refreshedAt' => NetworkClock::now()->toIso8601String(),
        ]);
    }

    /**
     * @param  array<int, array{one: array<int, array<string, mixed>>, two: array<int, array<string, mixed>>}>  $lineups
     * @return array<string, mixed>
     */
    private function court(Court $court, ?ClubMatch $match, array $lineups): array
    {
        $lineup = $match ? ($lineups[$match->id] ?? null) : null;

        return [
            'id' => $court->id,
            'name' => $court->name,
            'number' => (int) $court->court_number,
            'status' => (string) $court->status,
            'match' => $match ? [
                'id' => $match->id,
                'team_one_name' => $match->team_one_name,
                'team_two_name' => $match->team_two_name,
                'team_one_score' => (int) $match->team_one_score,
                'team_two_score' => (int) $match->team_two_score,
                'serving_team' => $match->serving_team,
                'game_number' => (int) $match->game_number,
                'target_score' => (int) ($match->target_score ?: 11),
                'match_type' => (string) $match->match_type,
                'started_at' => $match->started_at?->toIso8601String(),
                'team_one' => $lineup['one'] ?? [],
                'team_two' => $lineup['two'] ?? [],
            ] : null,
        ];
    }

    /**
     * The people on each live match, with the portraits they chose.
     *
     * Three queries for the whole board however many courts it has: the
     * rotation rows for every live match, the club-side player records behind
     * them, then the network profiles those map to. Doing it per court would be
     * three queries per court on a screen that reloads every few seconds.
     *
     * @param  Collection<int, ClubMatch>  $matches
     * @return array<int, array{one: array<int, array<string, mixed>>, two: array<int, array<string, mixed>>}>
     */
    private function lineups(Collection $matches): array
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

        $playerIds = $openPlayMatches
            ->flatMap(fn (OpenPlayMatch $match) => $match->participants->pluck('player_id'))
            ->filter()
            ->unique()
            ->values();

        $players = $this->playersById($playerIds);

        $lineups = [];

        foreach ($openPlayMatches as $openPlayMatch) {
            $sides = ['one' => [], 'two' => []];

            foreach ($openPlayMatch->participants as $participant) {
                $player = $players->get($participant->player_id);

                if (! $player) {
                    continue;
                }

                $side = $participant->team === 'two' ? 'two' : 'one';
                $sides[$side][] = $player;
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
    private function playersById(Collection $playerIds): Collection
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

    /** @return array<string, mixed> */
    private function publicPlayer(Player $player, ?PlayerProfile $profile): array
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

    /**
     * Who is next on, from the branch's running session.
     *
     * A board that only shows the courts tells everyone standing beside it
     * nothing. The queue is the half people actually watch for.
     *
     * @return array<int, array<string, mixed>>
     */
    private function waiting(Branch $branch): array
    {
        $session = OpenPlaySession::query()
            ->withoutGlobalScope('organization')
            ->where('branch_id', $branch->id)
            ->whereDate('session_date', NetworkClock::today())
            ->whereIn('status', ['open', 'live'])
            ->orderByDesc('status')
            ->first();

        if (! $session) {
            return [];
        }

        $entries = OpenPlayQueueEntry::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->where('status', 'waiting')
            ->orderBy('position')
            ->limit(8)
            ->get();

        if ($entries->isEmpty()) {
            return [];
        }

        $players = $this->playersById($entries->pluck('player_id')->filter()->unique()->values());

        return $entries
            ->map(fn (OpenPlayQueueEntry $entry) => $players->get($entry->player_id))
            ->filter()
            ->values()
            ->all();
    }

    /**
     * The same token gate the club-wide live display uses, so a venue that
     * secured one screen has secured them all.
     */
    private function authorizeDisplayAccess(Request $request, Branch $branch): void
    {
        $settings = $branch->organization?->settings ?? [];

        if (! ($settings['live_display_token_required'] ?? false) || empty($settings['live_display_token_hash'])) {
            return;
        }

        abort_unless(
            hash_equals((string) $settings['live_display_token_hash'], hash('sha256', (string) $request->query('token', ''))),
            403,
        );
    }
}
