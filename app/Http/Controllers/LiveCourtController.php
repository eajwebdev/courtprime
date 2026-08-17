<?php

namespace App\Http\Controllers;

use App\Models\Court;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LiveCourtController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Court::class);

        return Inertia::render('live-courts', [
            'courts' => $this->courts(),
        ]);
    }

    public function display(Request $request): Response
    {
        $branchId = $request->integer('branch') ?: null;
        $courts = $this->courts($branchId);
        $organization = $courts->first()?->branch?->organization;
        $settings = $organization?->settings ?? [];
        $this->authorizeDisplayAccess($request, $courts);

        return Inertia::render('display-live', [
            'courts' => $courts,
            'displaySettings' => [
                'brand' => $settings['live_display_branding'] ?? $organization?->name ?? 'EAJ CourtPrime Club',
                'logo_url' => $settings['logo_url'] ?? null,
                'primary_color' => $settings['primary_color'] ?? '#E61B5B',
                'announcement' => $settings['live_display_announcement'] ?? 'Upcoming Matches - Tournament Results - Announcements - Open Play Queue',
                'rotation_seconds' => $settings['live_display_rotation_seconds'] ?? 12,
            ],
        ]);
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

    private function authorizeDisplayAccess(Request $request, $courts): void
    {
        $organizations = $courts
            ->pluck('branch.organization')
            ->filter()
            ->unique('id');

        $securedOrganizations = $organizations->filter(fn ($organization) => ($organization->settings['live_display_token_required'] ?? false) && ! empty($organization->settings['live_display_token_hash']));

        if ($securedOrganizations->isEmpty()) {
            return;
        }

        $providedHash = hash('sha256', (string) $request->query('token', ''));

        abort_unless($securedOrganizations->every(
            fn ($organization) => hash_equals((string) $organization->settings['live_display_token_hash'], $providedHash)
        ), 403);
    }
}
