<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Court;
use App\Models\Organization;
use App\Models\OrganizationUserRole;
use App\Models\StaffProfile;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Database\Seeders\Concerns\UsesSeedCredentials;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

/**
 * Club partners on the CourtPrime network.
 *
 * A club partner is an organization tenant: its own branches, courts, staff
 * logins and business data, sharing only the network player identity. The one
 * default partner is CourtPrime Demo — two branches, three courts each — which
 * is the club every demo and screenshot runs on. Adding a real partner later is
 * one more entry in `partners()`, nothing else.
 *
 * Venues and accounts only. Nothing transactional is seeded: no reservations,
 * matches, open play sessions, sales or rankings, so a fresh install opens on
 * real empty states rather than on a day of invented business.
 */
class ClubPartnerSeeder extends Seeder
{
    use UsesSeedCredentials;

    public function run(): void
    {
        $this->callOnce(SubscriptionPlanSeeder::class);
        $this->callOnce(PlatformAdminSeeder::class);

        $superadmin = User::query()->where('email', 'superadmin@eaj.test')->firstOrFail();

        foreach ($this->partners() as $partner) {
            $organization = $this->organization($partner);

            $this->subscribe($organization, $partner);

            $branches = $this->branches($organization, $partner);

            $this->staff($organization, $partner, $branches);

            /* The platform operator can open every partner workspace. */
            OrganizationUserRole::query()->withoutGlobalScope('organization')->updateOrCreate(
                [
                    'user_id' => $superadmin->id,
                    'organization_id' => $organization->id,
                    'branch_id' => null,
                    'role_key' => 'eaj_superadmin',
                ],
                ['status' => 'active', 'is_primary' => false],
            );
        }
    }

    /**
     * The default network. CourtPrime Demo is first and, for now, alone.
     *
     * @return array<int, array<string, mixed>>
     */
    private function partners(): array
    {
        return [
            [
                'slug' => 'courtprime-demo',
                'name' => 'CourtPrime Demo',
                'code' => 'CPD',
                'owner_name' => 'EAJ Web Development Services',
                'email' => 'operations@courtprime.test',
                'phone' => '+63 900 555 0101',
                'plan' => 'professional',
                'subscription_status' => 'active',
                'primary_color' => '#1269E8',
                'branches' => [
                    [
                        'name' => 'CourtPrime Demo Main',
                        'code' => 'CPD-MAIN',
                        'address' => 'Lacson Street, Bacolod City',
                        'manager_name' => 'Mia Torres',
                        'contact_number' => '+63 917 555 0110',
                        'courts' => 3,
                    ],
                    [
                        'name' => 'CourtPrime Demo North',
                        'code' => 'CPD-NORTH',
                        'address' => 'Rizal Boulevard, Dumaguete City',
                        'manager_name' => 'Paolo Reyes',
                        'contact_number' => '+63 917 555 0120',
                        'courts' => 3,
                    ],
                ],
                /*
                 * One login per staff role, spread across both branches so the
                 * second venue is not a dead room in a demo. `branch` is an
                 * index into `branches`; null means organization-wide.
                 */
                'staff' => [
                    ['name' => 'Owner Demo', 'email' => 'owner@eaj.test', 'role' => 'organization_owner', 'branch' => null],
                    ['name' => 'Branch Manager Demo', 'email' => 'manager@eaj.test', 'role' => 'branch_manager', 'branch' => 0],
                    ['name' => 'Front Desk Demo', 'email' => 'frontdesk@eaj.test', 'role' => 'front_desk', 'branch' => 0],
                    ['name' => 'Cashier Demo', 'email' => 'cashier@eaj.test', 'role' => 'cashier', 'branch' => 0],
                    ['name' => 'Scorekeeper Demo', 'email' => 'scorekeeper@eaj.test', 'role' => 'scorekeeper', 'branch' => 1],
                    ['name' => 'Tournament Director Demo', 'email' => 'tournament@eaj.test', 'role' => 'tournament_director', 'branch' => 1],
                ],
            ],
        ];
    }

    /** @param  array<string, mixed>  $partner */
    private function organization(array $partner): Organization
    {
        return Organization::query()->updateOrCreate(
            ['slug' => $partner['slug']],
            [
                'name' => $partner['name'],
                'owner_name' => $partner['owner_name'],
                'email' => $partner['email'],
                'phone' => $partner['phone'],
                'status' => 'active',
                'timezone' => 'Asia/Manila',
                'currency' => 'PHP',
                'demo_mode' => true,
                'settings' => [
                    'booking_interval' => 30,
                    'minimum_booking_minutes' => 60,
                    'cancellation_hours' => 6,
                    'booking_window_days' => 30,
                    'allow_public_booking' => true,
                    'player_privacy_mode' => 'balanced',
                    'currency_symbol' => 'PHP',
                    'primary_color' => $partner['primary_color'],
                    'secondary_color' => '#111827',
                    'receipt_footer' => 'Powered by EAJ CourtPrime',
                ],
            ],
        );
    }

    /** @param  array<string, mixed>  $partner */
    private function subscribe(Organization $organization, array $partner): void
    {
        $plan = SubscriptionPlan::query()->where('code', $partner['plan'])->firstOrFail();

        Subscription::query()->updateOrCreate(
            ['organization_id' => $organization->id],
            [
                'subscription_plan_id' => $plan->id,
                'status' => $partner['subscription_status'],
                'billing_cycle' => 'monthly',
                'trial_ends_at' => now()->subDays(12),
                'current_period_starts_at' => now()->startOfMonth(),
                'current_period_ends_at' => now()->endOfMonth(),
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $partner
     * @return Collection<int, Branch>
     */
    private function branches(Organization $organization, array $partner): Collection
    {
        return collect($partner['branches'])->map(function (array $definition) use ($organization) {
            $branch = Branch::query()->updateOrCreate(
                ['organization_id' => $organization->id, 'code' => $definition['code']],
                [
                    'name' => $definition['name'],
                    'address' => $definition['address'],
                    'manager_name' => $definition['manager_name'],
                    'contact_number' => $definition['contact_number'],
                    'email' => strtolower($definition['code']).'@courtprime.test',
                    'status' => 'active',
                    'timezone' => 'Asia/Manila',
                    'currency' => 'PHP',
                    'tax_rate' => 12,
                    'operating_hours' => ['opens' => '06:00', 'closes' => '22:00'],
                ],
            );

            $this->courts($organization, $branch, $definition['courts']);

            return $branch;
        });
    }

    /**
     * Playable courts, numbered from one. Every court opens `available`: a court
     * is only reserved or under maintenance because something happened, and
     * nothing has happened yet on a fresh install.
     */
    private function courts(Organization $organization, Branch $branch, int $count): void
    {
        foreach (range(1, $count) as $number) {
            Court::query()->updateOrCreate(
                ['branch_id' => $branch->id, 'court_number' => $number],
                [
                    'organization_id' => $organization->id,
                    'name' => 'Court '.$number,
                    'court_type' => 'standard',
                    'environment' => $number % 2 === 0 ? 'outdoor' : 'indoor',
                    'surface_type' => 'cushioned acrylic',
                    'capacity' => 4,
                    'standard_hourly_rate' => 650,
                    'peak_hourly_rate' => 850,
                    'off_peak_hourly_rate' => 500,
                    'member_hourly_rate' => 520,
                    'guest_hourly_rate' => 700,
                    'amenities' => ['LED lights', 'Score display', 'Benches'],
                    'status' => 'available',
                ],
            );
        }
    }

    /**
     * Staff logins, their tenant role grant, and the HR record behind them. The
     * role grant is what the workspace switcher reads; `users.role_key` on its
     * own would not open the partner.
     *
     * @param  array<string, mixed>  $partner
     * @param  Collection<int, Branch>  $branches
     */
    private function staff(Organization $organization, array $partner, Collection $branches): void
    {
        foreach (array_values($partner['staff']) as $index => $member) {
            $branch = $member['branch'] === null ? null : $branches->get($member['branch']);

            $user = User::query()->updateOrCreate(
                ['email' => $member['email']],
                [
                    'organization_id' => $organization->id,
                    'branch_id' => $branch?->id,
                    'name' => $member['name'],
                    'password' => $this->seedPassword(),
                    'role_key' => $member['role'],
                    'is_superadmin' => false,
                    'position' => str($member['role'])->replace('_', ' ')->headline()->toString(),
                    'email_verified_at' => now(),
                ],
            );

            OrganizationUserRole::query()->withoutGlobalScope('organization')->updateOrCreate(
                [
                    'user_id' => $user->id,
                    'organization_id' => $organization->id,
                    'branch_id' => $branch?->id,
                    'role_key' => $member['role'],
                ],
                ['status' => 'active', 'is_primary' => true],
            );

            if (! $branch) {
                continue;
            }

            StaffProfile::query()->updateOrCreate(
                [
                    'organization_id' => $organization->id,
                    'employee_id' => sprintf('%s-STF-%03d', $partner['code'], $index + 1),
                ],
                [
                    'branch_id' => $branch->id,
                    'user_id' => $user->id,
                    'name' => $member['name'],
                    'position' => str($member['role'])->replace('_', ' ')->headline()->toString(),
                    'contact_email' => $member['email'],
                    'contact_mobile' => $branch->contact_number,
                    'hire_date' => today()->subMonths(8),
                    'status' => 'active',
                ],
            );
        }
    }
}
