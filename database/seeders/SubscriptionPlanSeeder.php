<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

/**
 * Platform pricing. These are catalogue rows, not tenant data, so every
 * install gets the same three plans regardless of which club partners exist.
 *
 * `monthly_price` stays the list price; the launch offer lives in metadata so
 * the landing page can show the strike-through without a schema change, and so
 * removing the promo is a data edit rather than a deploy.
 */
class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'code' => 'starter',
                'name' => 'Starter',
                'description' => 'Everything one location needs to take bookings and get paid.',
                'monthly_price' => 2499,
                'quarterly_price' => 6990,
                'annual_price' => 24990,
                'branch_limit' => 1,
                'court_limit' => 4,
                'staff_limit' => 8,
                'metadata' => [
                    'promo_price' => 999,
                    'promo_label' => 'Founding club offer',
                    'promo_note' => 'First 6 clubs. Locked for 12 months.',
                    'tagline' => 'For a single club finding its feet.',
                ],
                'features' => ['reservations', 'basic_pos', 'players', 'basic_reporting'],
            ],
            [
                'code' => 'professional',
                'name' => 'Professional',
                'description' => 'Multi-branch operations with live scoring, memberships and analytics.',
                'monthly_price' => 4999,
                'quarterly_price' => 13990,
                'annual_price' => 49990,
                'branch_limit' => 6,
                'court_limit' => 40,
                'staff_limit' => 80,
                'metadata' => [
                    'promo_price' => 2499,
                    'promo_label' => 'Founding club offer',
                    'promo_note' => 'First 6 clubs. Locked for 12 months.',
                    'tagline' => 'For clubs running more than one location.',
                    'featured' => true,
                ],
                'features' => ['reservations', 'pos', 'memberships', 'open_play', 'tournaments', 'live_scoring', 'inventory', 'advanced_analytics'],
            ],
            [
                'code' => 'enterprise',
                'name' => 'Enterprise',
                'description' => 'Custom limits, API access, white-label and priority support.',
                'monthly_price' => 9999,
                'quarterly_price' => 27990,
                'annual_price' => 99990,
                'branch_limit' => null,
                'court_limit' => null,
                'staff_limit' => null,
                'metadata' => [
                    'tagline' => 'For networks that need it their way.',
                ],
                'features' => ['unlimited_branches', 'api_access', 'custom_domain', 'white_label', 'advanced_permissions', 'priority_support'],
            ],
        ];

        foreach ($plans as $definition) {
            $features = $definition['features'];
            unset($definition['features']);

            $plan = SubscriptionPlan::query()->updateOrCreate(
                ['code' => $definition['code']],
                [...$definition, 'is_active' => true],
            );

            foreach ($features as $feature) {
                $plan->features()->updateOrCreate(
                    ['feature_key' => $feature],
                    [
                        'label' => str($feature)->replace('_', ' ')->headline()->toString(),
                        'enabled' => true,
                    ],
                );
            }
        }
    }
}
