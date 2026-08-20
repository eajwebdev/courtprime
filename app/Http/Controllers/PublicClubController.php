<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\Tournament;
use Inertia\Inertia;
use Inertia\Response;

class PublicClubController extends Controller
{
    public function show(string $slug): Response
    {
        $organization = Organization::query()
            ->with([
                'branches' => fn ($query) => $query
                    ->where('status', 'active')
                    ->with(['courts' => fn ($query) => $query->whereIn('status', ['available', 'reserved', 'occupied', 'open_play'])->orderBy('court_number')])
                    ->orderBy('name'),
            ])
            ->where('slug', $slug)
            ->whereIn('status', ['trial', 'active'])
            ->firstOrFail();

        return Inertia::render('public-club', [
            'seo' => $this->seo($organization),
            'club' => [
                'name' => $organization->name,
                'slug' => $organization->slug,
                'timezone' => $organization->timezone,
                'currency' => $organization->currency,
                'branches' => $organization->branches->map(fn ($branch) => [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'code' => $branch->code,
                    'address' => $branch->address,
                    'phone' => $branch->phone,
                    'email' => $branch->email,
                    'operating_hours' => $branch->operating_hours,
                    'courts' => $branch->courts->map(fn ($court) => [
                        'id' => $court->id,
                        'name' => $court->name,
                        'court_type' => $court->court_type,
                        'surface_type' => $court->surface_type,
                        'status' => $court->status,
                        'standard_hourly_rate' => $court->standard_hourly_rate,
                    ])->values(),
                ])->values(),
                'tournaments' => Tournament::query()
                    ->withoutGlobalScope('organization')
                    ->where('organization_id', $organization->id)
                    ->where('visibility', 'public')
                    ->whereIn('status', ['published', 'registration_open', 'live'])
                    ->orderBy('starts_on')
                    ->limit(6)
                    ->get(['id', 'name', 'slug', 'starts_on', 'ends_on', 'format', 'entry_fee', 'status'])
                    ->map(fn (Tournament $tournament) => [
                        'name' => $tournament->name,
                        'starts_on' => $tournament->starts_on?->toDateString(),
                        'ends_on' => $tournament->ends_on?->toDateString(),
                        'format' => $tournament->format,
                        'entry_fee' => $tournament->entry_fee,
                        'status' => $tournament->status,
                    ]),
            ],
        ]);
    }

    /**
     * Per-club search metadata.
     *
     * A club page is the one page on the network that answers a local search —
     * somebody looking for courts in their own city — so it says the city in
     * its title and describes itself as a place, not as a screen in an app.
     * Each branch is published as a SportsActivityLocation with its address and
     * phone, which is what puts a real venue into local results.
     *
     * @return array<string, mixed>
     */
    private function seo(Organization $organization): array
    {
        $branches = $organization->branches;
        $address = (string) ($branches->first()->address ?? '');
        $parts = array_values(array_filter(array_map('trim', explode(',', $address))));
        $city = $parts ? (string) end($parts) : null;
        $courts = $branches->sum(fn ($branch) => $branch->courts->count());

        $where = $city ? " in {$city}" : '';
        $countText = $courts > 0
            ? $courts.' '.($courts === 1 ? 'court' : 'courts')
            : 'Courts';

        return [
            'title' => "{$organization->name}{$where} | Pickleball Courts on CourtPrime",
            'description' => "{$countText} at {$organization->name}{$where}. See hourly rates, open play sessions and upcoming tournaments, and book with one CourtPrime player identity.",
            'schema' => [[
                '@context' => 'https://schema.org',
                '@type' => 'SportsOrganization',
                'name' => $organization->name,
                'url' => route('clubs.public.show', $organization->slug),
                'sport' => 'Pickleball',
                'location' => $branches->map(fn ($branch) => array_filter([
                    '@type' => 'SportsActivityLocation',
                    'name' => $branch->name,
                    'address' => $branch->address,
                    'telephone' => $branch->phone,
                    'email' => $branch->email,
                ]))->values()->all(),
            ]],
        ];
    }
}
