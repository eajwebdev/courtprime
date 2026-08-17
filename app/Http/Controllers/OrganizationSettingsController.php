<?php

namespace App\Http\Controllers;

use App\Http\Requests\OrganizationSettingsRequest;
use App\Models\OrganizationUserRole;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationSettingsController extends Controller
{
    public function show(TenantContext $tenantContext): Response
    {
        $organization = $tenantContext->currentOrganization();

        if (! $organization) {
            throw ValidationException::withMessages(['organization_id' => 'Select a CourtPrime organization workspace first.']);
        }

        $this->authorize('manage', $organization);

        $organization->load(['subscription.plan.features']);

        $canCustomizeBranding = $organization->subscription?->plan?->features
            ->firstWhere('feature_key', 'white_label')?->enabled === true || auth()->user()?->is_superadmin;

        return Inertia::render('organization-settings', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'owner_name' => $organization->owner_name,
                'email' => $organization->email,
                'phone' => $organization->phone,
                'status' => $organization->status,
                'timezone' => $organization->timezone,
                'currency' => $organization->currency,
                'demo_mode' => $organization->demo_mode,
                'settings' => $this->publicSettings($organization->settings ?? []),
            ],
            'subscription' => $organization->subscription ? [
                'status' => $organization->subscription->status,
                'billing_cycle' => $organization->subscription->billing_cycle,
                'trial_ends_at' => $organization->subscription->trial_ends_at?->toDateString(),
                'current_period_ends_at' => $organization->subscription->current_period_ends_at?->toDateString(),
                'plan' => $organization->subscription->plan ? [
                    'name' => $organization->subscription->plan->name,
                    'code' => $organization->subscription->plan->code,
                    'monthly_price' => $organization->subscription->plan->monthly_price,
                    'branch_limit' => $organization->subscription->plan->branch_limit,
                    'court_limit' => $organization->subscription->plan->court_limit,
                    'staff_limit' => $organization->subscription->plan->staff_limit,
                    'features' => $organization->subscription->plan->features
                        ->map(fn ($feature) => [
                            'key' => $feature->feature_key,
                            'label' => $feature->label,
                            'enabled' => $feature->enabled,
                            'limit' => $feature->limit_value,
                        ])
                        ->values(),
                ] : null,
            ] : null,
            'canCustomizeBranding' => $canCustomizeBranding,
            'usage' => [
                'branches' => $organization->branches()->count(),
                'courts' => $organization->courts()->count(),
                'staff' => OrganizationUserRole::query()
                    ->withoutGlobalScope('organization')
                    ->where('organization_id', $organization->id)
                    ->where('status', 'active')
                    ->distinct('user_id')
                    ->count('user_id'),
            ],
        ]);
    }

    public function update(OrganizationSettingsRequest $request, TenantContext $tenantContext): RedirectResponse
    {
        $organization = $tenantContext->currentOrganization();

        if (! $organization) {
            throw ValidationException::withMessages(['organization_id' => 'Select a CourtPrime organization workspace first.']);
        }

        $this->authorize('manage', $organization);

        $organization->loadMissing('subscription.plan.features');

        $validated = $request->validated();
        $settings = array_merge($this->settings($organization->settings ?? []), Arr::only($validated, [
            'booking_window_days',
            'cancellation_cutoff_hours',
            'default_deposit_percent',
            'require_deposit',
            'allow_public_booking',
            'player_privacy_mode',
            'logo_url',
            'primary_color',
            'secondary_color',
            'allow_white_label',
            'receipt_footer',
            'payment_methods',
            'membership_auto_renewal',
            'send_email_notifications',
            'send_sms_notifications',
            'send_push_notifications',
            'live_display_branding',
            'live_display_rotation_seconds',
            'live_display_announcement',
            'live_display_token_required',
            'payment_gateway',
            'sms_gateway',
            'email_provider',
            'api_access_enabled',
        ]));

        if (! empty($validated['live_display_token'])) {
            $settings['live_display_token_hash'] = hash('sha256', $validated['live_display_token']);
        }

        if (! $organization->subscription?->plan?->features->firstWhere('feature_key', 'white_label')?->enabled && ! auth()->user()?->is_superadmin) {
            $settings['allow_white_label'] = false;
        }

        $organization->update([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']).'-'.$organization->id,
            'owner_name' => $validated['owner_name'] ?? null,
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'timezone' => $validated['timezone'],
            'currency' => Str::upper($validated['currency']),
            'settings' => $settings,
        ]);

        return back()->with('success', 'CourtPrime organization settings saved.');
    }

    /**
     * @param  array<string, mixed>  $settings
     * @return array<string, mixed>
     */
    private function settings(array $settings): array
    {
        return array_merge([
            'booking_window_days' => 30,
            'cancellation_cutoff_hours' => 4,
            'default_deposit_percent' => 20,
            'require_deposit' => false,
            'allow_public_booking' => true,
            'player_privacy_mode' => 'strict',
            'logo_url' => null,
            'primary_color' => '#e61b5b',
            'secondary_color' => '#111827',
            'allow_white_label' => false,
            'receipt_footer' => 'Powered by EAJ CourtPrime',
            'payment_methods' => ['cash', 'card', 'gcash'],
            'membership_auto_renewal' => true,
            'send_email_notifications' => true,
            'send_sms_notifications' => false,
            'send_push_notifications' => false,
            'live_display_branding' => 'CourtPrime',
            'live_display_rotation_seconds' => 12,
            'live_display_announcement' => null,
            'live_display_token_required' => false,
            'payment_gateway' => null,
            'sms_gateway' => null,
            'email_provider' => null,
            'api_access_enabled' => false,
        ], $settings);
    }

    /**
     * @param  array<string, mixed>  $settings
     * @return array<string, mixed>
     */
    private function publicSettings(array $settings): array
    {
        $merged = $this->settings($settings);
        $merged['live_display_token_configured'] = ! empty($merged['live_display_token_hash']);
        unset($merged['live_display_token_hash']);

        return $merged;
    }
}
