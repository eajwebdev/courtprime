<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\ClubMatch;
use App\Models\Court;
use App\Models\OpenPlayQueueEntry;
use App\Models\OpenPlaySession;
use App\Services\ScoreboardLineupService;
use App\Support\NetworkClock;
use Illuminate\Http\Request;
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
    public function __construct(private readonly ScoreboardLineupService $lineups) {}

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

        $lineups = $this->lineups->forMatches($liveMatches->flatten());
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
                'serving_number' => $this->servingNumber($match),
                'serve_call' => $this->serveCall($match),
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

        $players = $this->lineups->playersById($entries->pluck('player_id')->filter()->unique()->values());

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

    private function servingTeam(ClubMatch $match): string
    {
        return in_array($match->serving_team, ['team_one', 'team_two'], true) ? $match->serving_team : 'team_one';
    }

    private function servingNumber(ClubMatch $match): ?int
    {
        if ($match->match_type === 'singles') {
            return null;
        }

        $number = (int) ($match->serving_number ?? 0);

        if (in_array($number, [1, 2], true)) {
            return $number;
        }

        return (int) $match->team_one_score === 0 && (int) $match->team_two_score === 0 && $this->servingTeam($match) === 'team_one' ? 2 : 1;
    }

    private function serveCall(ClubMatch $match): string
    {
        $servingTeam = $this->servingTeam($match);
        $serverScore = $servingTeam === 'team_one' ? (int) $match->team_one_score : (int) $match->team_two_score;
        $receiverScore = $servingTeam === 'team_one' ? (int) $match->team_two_score : (int) $match->team_one_score;
        $servingNumber = $this->servingNumber($match);

        return $servingNumber ? "{$serverScore}-{$receiverScore}-{$servingNumber}" : "{$serverScore}-{$receiverScore}";
    }
}
