<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\ClubMatch;
use App\Models\Court;
use App\Models\Organization;
use App\Services\ScoreboardLineupService;
use App\Services\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LiveCourtController extends Controller
{
    public function __construct(private readonly ScoreboardLineupService $lineups) {}

    public function index(): Response
    {
        $this->authorize('viewAny', Court::class);

        return Inertia::render('live-courts', [
            'courts' => $this->courts(),
        ]);
    }

    /**
     * The club-wide wall board: every court the club runs, with the people on
     * them.
     *
     * One club at a time. The board wears a club's branding and the courts
     * under it have to belong to that club — a signed-in visitor gets their own
     * workspace, and a TV in a venue names its branch in the URL. Neither is
     * optional: with no way to tell whose board this is, there is no honest
     * screen to draw, and the alternative is showing one club's name over
     * another club's scores.
     */
    public function display(Request $request, TenantContext $tenantContext): Response
    {
        $organization = $this->displayOrganization($request, $tenantContext);

        $branchId = $request->integer('branch') ?: null;

        $courts = Court::query()
            ->withoutGlobalScope('organization')
            /*
             * No organization means a signed-in platform operator with no
             * workspace chosen, which is the one case that legitimately spans
             * clubs — the same view /live-courts already gives them. Nobody
             * else reaches here without one.
             */
            ->when($organization, fn ($query) => $query->where('organization_id', $organization->id))
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->orderBy('branch_id')
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

        /* A platform operator spanning clubs has no one club's branding to
           wear, so the board falls back to whichever club it is showing. */
        $organization ??= $courts->first()?->branch?->organization;
        $settings = $organization?->settings ?? [];

        return Inertia::render('display-live', [
            'courts' => $courts
                ->map(fn (Court $court) => $this->court($court, $liveMatches->get($court->id)?->first(), $lineups))
                ->values(),
            'displaySettings' => [
                'brand' => $settings['live_display_branding'] ?? $organization?->name ?? 'EAJ CourtPrime Club',
                'logo_url' => $settings['logo_url'] ?? null,
                'primary_color' => $settings['primary_color'] ?? '#E61B5B',
                'announcement' => $settings['live_display_announcement'] ?? 'Upcoming Matches - Tournament Results - Announcements - Open Play Queue',
                'rotation_seconds' => $settings['live_display_rotation_seconds'] ?? 12,
                /* How long one portrait holds before the next. */
                'portrait_seconds' => max((int) ($settings['scoreboard_portrait_seconds'] ?? 10), 4),
            ],
        ]);
    }

    /**
     * The same board as JSON, for the screen to keep itself current.
     *
     * The board used to ask Inertia for the whole page every ten seconds,
     * which re-rendered it from new props: the portraits restarted their cycle
     * and the scores blinked. This is the courts and nothing else, so the
     * screen can fold new scores into what it is already showing.
     *
     * Gated exactly as the page is — same organization resolution, same token —
     * because it answers the same question and must not be the softer way in.
     */
    public function feed(Request $request, TenantContext $tenantContext): JsonResponse
    {
        $organization = $this->displayOrganization($request, $tenantContext);

        $branchId = $request->integer('branch') ?: null;

        $courts = Court::query()
            ->withoutGlobalScope('organization')
            ->when($organization, fn ($query) => $query->where('organization_id', $organization->id))
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->orderBy('branch_id')
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

        return response()->json([
            'courts' => $courts
                ->map(fn (Court $court) => $this->court($court, $liveMatches->get($court->id)?->first(), $lineups))
                ->values(),
        ]);
    }

    /**
     * Whose board this is.
     *
     * A signed-in user gets the workspace they are already in. Anyone not
     * signed in has to name a branch, which is how the TV in a venue is set up,
     * and the branch decides the club — the query string never picks the
     * organization directly, so there is nothing to walk through by
     * incrementing a number.
     *
     * Null means a signed-in platform operator who has not chosen a workspace:
     * they see every club, which is what /live-courts already shows them. An
     * anonymous visitor never reaches that state, because the board used to
     * hand a stranger every club's courts under the first club's branding.
     */
    private function displayOrganization(Request $request, TenantContext $tenantContext): ?Organization
    {
        $organization = $tenantContext->currentOrganization();

        if ($organization) {
            return $organization;
        }

        if ($tenantContext->user()) {
            return null;
        }

        $branchId = $request->integer('branch') ?: null;

        abort_if($branchId === null, 404);

        $branch = Branch::query()
            ->withoutGlobalScope('organization')
            ->with('organization')
            ->find($branchId);

        abort_if($branch?->organization === null, 404);

        $this->authorizeDisplayAccess($request, $branch->organization);

        return $branch->organization;
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

    private function courts(?int $branchId = null)
    {
        return Court::query()
            ->with(['branch.organization', 'matches' => fn ($query) => $query->where('status', 'live')->latest()->limit(1)])
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->orderBy('branch_id')
            ->orderBy('court_number')
            ->get();
    }

    /**
     * The same token gate the branch scoreboard uses, so a club that secured
     * one screen has secured them all.
     */
    private function authorizeDisplayAccess(Request $request, Organization $organization): void
    {
        $settings = $organization->settings ?? [];

        if (! ($settings['live_display_token_required'] ?? false) || empty($settings['live_display_token_hash'])) {
            return;
        }

        abort_unless(
            hash_equals((string) $settings['live_display_token_hash'], hash('sha256', (string) $request->query('token', ''))),
            403,
        );
    }
}
