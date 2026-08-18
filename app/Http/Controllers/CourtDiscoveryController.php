<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Court;
use App\Services\CourtAvailabilityService;
use Illuminate\Http\Request;
use App\Support\NetworkClock;
use Inertia\Inertia;
use Inertia\Response;

class CourtDiscoveryController extends Controller
{
    public function __invoke(Request $request, CourtAvailabilityService $availability): Response
    {
        /* Club-local today, not UTC today. See NetworkClock. */
        $date = $request->query('date', NetworkClock::today());
        $search = trim((string) $request->query('search', ''));

        $branches = Branch::query()
            ->withoutGlobalScope('organization')
            ->with(['organization', 'photos', 'courts' => fn ($query) => $query
                ->withoutGlobalScope('organization')
                ->whereIn('status', ['available', 'reserved', 'occupied', 'open_play'])
                ->orderBy('court_number')])
            ->where('status', 'active')
            ->whereHas('organization', fn ($query) => $query->whereIn('status', ['trial', 'active']))
            ->when($search, function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%")
                        ->orWhereHas('organization', fn ($query) => $query->where('name', 'like', "%{$search}%"));
                });
            })
            ->orderBy('name')
            ->get()
            ->map(fn (Branch $branch) => [
                'id' => $branch->id,
                'name' => $branch->name,
                'code' => $branch->code,
                'address' => $branch->address,
                'timezone' => $branch->timezone,
                'operating_hours' => $branch->operating_hours,
                'contact_number' => $branch->contact_number,
                'email' => $branch->email,
                /* Venue gallery, ordered. Empty until the club uploads. */
                'photos' => $branch->photos->map(fn ($photo) => [
                    'id' => $photo->id,
                    'url' => $photo->url,
                    'caption' => $photo->caption,
                ])->values(),
                'organization' => [
                    'id' => $branch->organization?->id,
                    'name' => $branch->organization?->name,
                    'slug' => $branch->organization?->slug,
                    /*
                     * Each club owns its own links. They live in the existing
                     * settings JSON, so adding a channel needs no migration.
                     */
                    'links' => array_filter([
                        'website' => $branch->organization?->settings['website'] ?? null,
                        'facebook' => $branch->organization?->settings['facebook'] ?? null,
                        'instagram' => $branch->organization?->settings['instagram'] ?? null,
                        'tiktok' => $branch->organization?->settings['tiktok'] ?? null,
                    ]),
                ],
                'courts' => $branch->courts->map(fn (Court $court) => [
                    'id' => $court->id,
                    'name' => $court->name,
                    'court_type' => $court->court_type,
                    'surface_type' => $court->surface_type,
                    'standard_hourly_rate' => $court->standard_hourly_rate,
                    'available_slots' => collect($availability->slots($court, $date))->where('available', true)->count(),
                ])->values(),
            ]);

        return Inertia::render('court-discovery', [
            'date' => $date,
            'search' => $search,
            'branches' => $branches,
        ]);
    }
}
