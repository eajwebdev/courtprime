<?php

namespace App\Http\Controllers;

use App\Enums\PlatformRole;
use App\Models\Branch;
use App\Models\ClubMatch;
use App\Models\Court;
use App\Models\Organization;
use App\Models\SubscriptionPlan;
use App\Models\User;
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
            /*
             * Keyed on the organisation, not the branch.
             *
             * Two different clubs each run a venue called "Dumaguete Pickleball
             * Hub", so a branch-level list rendered the same name twice and read
             * as a duplicate-render bug. A club is also the right unit here: the
             * section is about who is on the network, not how many sites they
             * operate.
             */
            return Organization::query()
                ->withoutGlobalScope('organization')
                ->whereIn('status', ['trial', 'active'])
                ->withCount('branches')
                ->get()
                ->map(function (Organization $organization): array {
                    $branches = Branch::query()
                        ->withoutGlobalScope('organization')
                        ->where('organization_id', $organization->id)
                        ->get(['id', 'address']);

                    $courtQuery = Court::query()
                        ->withoutGlobalScope('organization')
                        ->whereIn('branch_id', $branches->pluck('id'));

                    $address = (string) ($branches->first()->address ?? '');
                    $parts = array_filter(array_map('trim', explode(',', $address)));

                    return [
                        'name' => (string) $organization->name,
                        'city' => $parts ? (string) end($parts) : null,
                        'slug' => $organization->slug,
                        'branches' => (int) $organization->branches_count,
                        'courts' => (int) $courtQuery->count(),
                        'rate' => $courtQuery->min('standard_hourly_rate'),
                    ];
                })
                ->sortByDesc('courts')
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
            /* A tile reading zero is worse than one tile fewer: "0 registered
               players" is an argument against the product, made by the
               product. A network with none of something simply does not
               mention it until it has some. */
            return collect([
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
                    /*
                     * People who signed themselves up, not everybody with a
                     * row in `players`.
                     *
                     * A club adds walk-ins at the open play board by typing a
                     * name, and each one gets a club-side player record so
                     * their games can be scored. Counting those made this page
                     * claim as registered a crowd of people who have never
                     * seen the site: it said sixteen when nobody had actually
                     * registered at all.
                     *
                     * An account is what registering produces, and role_key
                     * defaults to player, so the staff a club creates are not
                     * counted either. A walk-in who later signs up with the
                     * same email starts counting from that point, which is
                     * when it becomes true of them.
                     */
                    'value' => User::query()->where('role_key', PlatformRole::Player->value)->count(),
                    'suffix' => '',
                ],
                [
                    'key' => 'matches',
                    'label' => 'Matches recorded',
                    'value' => ClubMatch::query()->withoutGlobalScope('organization')->count(),
                    'suffix' => '',
                ],
            ])->filter(fn (array $stat) => $stat['value'] > 0)->values()->all();
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
