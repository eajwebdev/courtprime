<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\ClubMatch;
use App\Models\Court;
use App\Models\Organization;
use App\Models\Player;
use App\Models\SubscriptionPlan;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('welcome', [
            'plans' => SubscriptionPlan::query()
                ->with('features')
                ->where('is_active', true)
                ->orderBy('monthly_price')
                ->get(),
            'networkStats' => $this->networkStats(),
            'networkClubs' => $this->networkClubs(),
        ]);
    }

    /**
     * Real connected locations for the landing story.
     *
     * The page used to hardcode invented club names. Those are replaced with
     * whatever is actually live; the frontend pads with neutral placeholders
     * when the network is smaller than the layout expects, so nothing on the
     * page ever names a club that does not exist.
     *
     * @return array<int, array{name: string, city: string|null, slug: string|null, courts: int, rate: float|null}>
     */
    private function networkClubs(): array
    {
        return Cache::remember('landing.network_clubs', now()->addMinutes(10), function (): array {
            return Branch::query()
                ->withoutGlobalScope('organization')
                ->with('organization:id,name,slug,status')
                ->withCount('courts')
                ->whereHas('organization', fn ($query) => $query->whereIn('status', ['trial', 'active']))
                ->orderByDesc('courts_count')
                ->limit(6)
                ->get()
                ->map(function (Branch $branch): array {
                    $address = (string) ($branch->address ?? '');
                    $parts = array_filter(array_map('trim', explode(',', $address)));

                    return [
                        'name' => (string) $branch->name,
                        'city' => $parts ? (string) end($parts) : null,
                        'slug' => $branch->organization?->slug,
                        'courts' => (int) $branch->courts_count,
                        'rate' => $branch->courts()->min('standard_hourly_rate'),
                    ];
                })
                ->values()
                ->all();
        });
    }

    /**
     * Live network totals for the landing page.
     *
     * Read-only aggregates across every tenant, so the organization global
     * scope is removed deliberately, no tenant data is exposed, only counts.
     * Cached because this renders on an unauthenticated, high-traffic page.
     *
     * @return array<int, array{key: string, label: string, value: int, suffix: string}>
     */
    private function networkStats(): array
    {
        return Cache::remember('landing.network_stats', now()->addMinutes(10), function (): array {
            return [
                [
                    'key' => 'clubs',
                    'label' => 'Connected clubs',
                    'value' => Organization::query()
                        ->withoutGlobalScope('organization')
                        ->whereIn('status', ['trial', 'active'])
                        ->count(),
                    'suffix' => '',
                ],
                [
                    'key' => 'branches',
                    'label' => 'Locations live',
                    'value' => Branch::query()->withoutGlobalScope('organization')->count(),
                    'suffix' => '',
                ],
                [
                    'key' => 'courts',
                    'label' => 'Courts connected',
                    'value' => Court::query()->withoutGlobalScope('organization')->count(),
                    'suffix' => '',
                ],
                [
                    'key' => 'players',
                    'label' => 'Registered players',
                    'value' => Player::query()->count(),
                    'suffix' => '',
                ],
                [
                    'key' => 'matches',
                    'label' => 'Matches recorded',
                    'value' => ClubMatch::query()->withoutGlobalScope('organization')->count(),
                    'suffix' => '',
                ],
            ];
        });
    }

    public function privacy(): Response
    {
        return Inertia::render('public-legal', [
            'title' => 'Privacy Policy',
            'updated' => 'August 16, 2026',
            'sections' => [
                ['title' => 'CourtPrime Identity', 'body' => 'EAJ CourtPrime uses one global player identity so players can discover courts, book games, join events, and keep a connected sports record across participating facilities.'],
                ['title' => 'Tenant Privacy', 'body' => 'Business records such as payments, memberships, wallets, staff notes, expenses, inventory, and private customer history remain owned by the organization that created them.'],
                ['title' => 'Operational Data', 'body' => 'CourtPrime stores reservation, match, ranking, notification, support, and billing information needed to operate the platform and provide connected player experiences.'],
                ['title' => 'Contact', 'body' => 'For privacy questions, contact EAJ Web Development Services through the demo or support channels listed on CourtPrime.'],
            ],
        ]);
    }

    public function terms(): Response
    {
        return Inertia::render('public-legal', [
            'title' => 'Terms of Service',
            'updated' => 'August 16, 2026',
            'sections' => [
                ['title' => 'Platform Use', 'body' => 'CourtPrime is provided as a SaaS platform for pickleball organizations, staff, and players participating in the CourtPrime network.'],
                ['title' => 'Organization Responsibility', 'body' => 'Organizations are responsible for configuring their branches, courts, prices, staff access, customer records, and public availability accurately.'],
                ['title' => 'Player Network', 'body' => 'Players may use one CourtPrime identity across participating clubs while each organization keeps its private operational data isolated.'],
                ['title' => 'Service Changes', 'body' => 'EAJ Web Development Services may improve, update, or restrict platform features to protect security, reliability, and tenant privacy.'],
            ],
        ]);
    }
}
