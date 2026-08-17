<?php

namespace App\Http\Controllers;

use App\Http\Requests\OnboardingStepRequest;
use App\Models\MembershipPlan;
use App\Models\OrganizationUserRole;
use App\Models\Product;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(TenantContext $tenantContext): Response
    {
        $organization = $tenantContext->currentOrganization();

        if (! $organization) {
            throw ValidationException::withMessages(['organization_id' => 'Select a CourtPrime organization workspace first.']);
        }

        $this->authorize('manage', $organization);

        $completed = Arr::get($organization->settings ?? [], 'onboarding.completed', []);
        $usage = [
            'branches' => $organization->branches()->count(),
            'courts' => $organization->courts()->count(),
            'staff' => OrganizationUserRole::query()
                ->withoutGlobalScope('organization')
                ->where('organization_id', $organization->id)
                ->where('status', 'active')
                ->distinct('user_id')
                ->count('user_id'),
            'membership_plans' => MembershipPlan::query()
                ->withoutGlobalScope('organization')
                ->where('organization_id', $organization->id)
                ->count(),
            'products' => Product::query()
                ->withoutGlobalScope('organization')
                ->where('organization_id', $organization->id)
                ->count(),
        ];

        $steps = collect($this->steps())->map(function (array $step) use ($completed, $usage) {
            $isComplete = (bool) ($completed[$step['key']] ?? false);

            return [
                ...$step,
                'completed' => $isComplete,
                'auto_ready' => $this->autoReady($step['key'], $usage),
            ];
        })->values();

        $progress = $steps->isEmpty()
            ? 0
            : (int) round(($steps->where('completed', true)->count() / $steps->count()) * 100);

        return Inertia::render('onboarding', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'status' => $organization->status,
            ],
            'steps' => $steps,
            'progress' => $progress,
            'usage' => $usage,
        ]);
    }

    public function update(OnboardingStepRequest $request, TenantContext $tenantContext): RedirectResponse
    {
        $organization = $tenantContext->currentOrganization();

        if (! $organization) {
            throw ValidationException::withMessages(['organization_id' => 'Select a CourtPrime organization workspace first.']);
        }

        $this->authorize('manage', $organization);

        $validated = $request->validated();
        $settings = $organization->settings ?? [];
        $completed = Arr::get($settings, 'onboarding.completed', []);
        $completed[$validated['step']] = (bool) $validated['completed'];

        $settings['onboarding'] = [
            ...Arr::get($settings, 'onboarding', []),
            'completed' => $completed,
            'status' => collect($this->steps())->every(fn (array $step) => (bool) ($completed[$step['key']] ?? false)) ? 'ready' : 'in_progress',
            'updated_at' => now()->toDateTimeString(),
        ];

        $organization->update(['settings' => $settings]);

        return back()->with('success', 'CourtPrime onboarding progress saved.');
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function steps(): array
    {
        return [
            ['key' => 'organization_information', 'title' => 'Organization Information', 'description' => 'Confirm club identity, contact details, timezone, currency, and privacy posture.', 'href' => '/organization-settings'],
            ['key' => 'branch_setup', 'title' => 'Branch Setup', 'description' => 'Create the primary location and any additional branches included in the plan.', 'href' => '/branches'],
            ['key' => 'court_creation', 'title' => 'Court Creation', 'description' => 'Add courts with numbers, surfaces, environments, hourly rates, and availability status.', 'href' => '/courts'],
            ['key' => 'operating_hours', 'title' => 'Operating Hours', 'description' => 'Set branch operating hours and local timezone rules.', 'href' => '/branches'],
            ['key' => 'pricing_tax', 'title' => 'Pricing & Tax', 'description' => 'Review court rates, default deposit, currency, and tax settings.', 'href' => '/organization-settings'],
            ['key' => 'reservation_rules', 'title' => 'Reservation Rules', 'description' => 'Set booking windows, cancellation cutoff, and public booking access.', 'href' => '/organization-settings'],
            ['key' => 'staff_roles', 'title' => 'Staff & Roles', 'description' => 'Invite owners, managers, front desk staff, cashiers, scorekeepers, and directors.', 'href' => '/team-roles'],
            ['key' => 'membership_plans', 'title' => 'Membership Plans', 'description' => 'Create member plans and benefits for player/customer relationships.', 'href' => '/memberships'],
            ['key' => 'pos_configuration', 'title' => 'POS Configuration', 'description' => 'Add pro-shop products, rentals, drinks, services, and tournament fee items.', 'href' => '/products'],
            ['key' => 'payment_configuration', 'title' => 'Payment Configuration', 'description' => 'Confirm cashier sessions, payment methods, receipts, and reconciliation workflow.', 'href' => '/payments'],
            ['key' => 'notification_setup', 'title' => 'Notification Setup', 'description' => 'Review support, notification center, and customer communication settings.', 'href' => '/notifications'],
            ['key' => 'go_live', 'title' => 'Go Live', 'description' => 'Confirm setup and begin operating the connected CourtPrime workspace.', 'href' => '/dashboard'],
        ];
    }

    /**
     * @param  array<string, int>  $usage
     */
    private function autoReady(string $step, array $usage): bool
    {
        return match ($step) {
            'branch_setup', 'operating_hours' => $usage['branches'] > 0,
            'court_creation' => $usage['courts'] > 0,
            'staff_roles' => $usage['staff'] > 0,
            'membership_plans' => $usage['membership_plans'] > 0,
            'pos_configuration' => $usage['products'] > 0,
            default => false,
        };
    }
}
