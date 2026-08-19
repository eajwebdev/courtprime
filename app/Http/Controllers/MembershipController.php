<?php

namespace App\Http\Controllers;

use App\Http\Requests\MembershipPlanStoreRequest;
use App\Http\Requests\PlayerMembershipStoreRequest;
use App\Http\Requests\WaiverTemplateStoreRequest;
use App\Models\MembershipPlan;
use App\Models\OrganizationPlayer;
use App\Models\PlayerMembership;
use App\Models\WaiverTemplate;
use App\Services\SubscriptionFeatureGate;
use App\Services\TenantContext;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MembershipController extends Controller
{
    public function index(TenantContext $tenantContext, SubscriptionFeatureGate $subscriptionGate): Response
    {
        $this->authorize('viewAny', PlayerMembership::class);
        $subscriptionGate->ensureAnyFeatureEnabled($tenantContext->currentOrganization(), ['memberships'], 'memberships');

        $organizationId = $tenantContext->currentOrganizationId();

        return Inertia::render('memberships', [
            'plans' => MembershipPlan::query()
                ->withCount('memberships')
                ->orderBy('name')
                ->get(),
            'memberships' => PlayerMembership::query()
                ->with(['plan', 'organizationPlayer.playerProfile'])
                ->latest()
                ->paginate(15),
            'waiverTemplates' => WaiverTemplate::query()
                ->withCount('acceptedWaivers')
                ->latest()
                ->get(),
            'players' => OrganizationPlayer::query()
                ->withoutGlobalScope('organization')
                ->with('playerProfile')
                ->when($organizationId, fn ($query) => $query->where('organization_id', $organizationId))
                ->orderByDesc('last_visit_at')
                ->limit(100)
                ->get()
                ->map(fn (OrganizationPlayer $organizationPlayer) => [
                    'id' => $organizationPlayer->id,
                    'name' => $organizationPlayer->playerProfile?->display_name,
                    'courtprime_player_id' => $organizationPlayer->playerProfile?->courtprime_player_id,
                ]),
        ]);
    }

    public function storeWaiverTemplate(WaiverTemplateStoreRequest $request, TenantContext $tenantContext, SubscriptionFeatureGate $subscriptionGate): RedirectResponse
    {
        $this->authorize('create', WaiverTemplate::class);
        $subscriptionGate->ensureAnyFeatureEnabled($tenantContext->currentOrganization(), ['memberships'], 'memberships');

        $organizationId = $tenantContext->currentOrganizationId();

        if (! $organizationId) {
            throw ValidationException::withMessages(['organization_id' => 'Select a CourtPrime organization workspace first.']);
        }

        $validated = $request->validated();

        WaiverTemplate::query()->updateOrCreate(
            [
                'organization_id' => $organizationId,
                'title' => $validated['title'],
                'version' => $validated['version'],
            ],
            [
                'body' => $validated['body'],
                'required_before_booking' => (bool) ($validated['required_before_booking'] ?? false),
                'status' => $validated['status'],
            ],
        );

        return back()->with('success', 'CourtPrime waiver template saved.');
    }

    public function storePlan(MembershipPlanStoreRequest $request, TenantContext $tenantContext, SubscriptionFeatureGate $subscriptionGate): RedirectResponse
    {
        $this->authorize('create', MembershipPlan::class);
        $subscriptionGate->ensureAnyFeatureEnabled($tenantContext->currentOrganization(), ['memberships'], 'memberships');

        $organizationId = $tenantContext->currentOrganizationId();

        if (! $organizationId) {
            throw ValidationException::withMessages(['organization_id' => 'Select a CourtPrime organization workspace first.']);
        }

        $validated = $request->validated();
        $code = Str::upper($validated['code']);

        if (MembershipPlan::query()->withoutGlobalScope('organization')->where('organization_id', $organizationId)->where('code', $code)->exists()) {
            throw ValidationException::withMessages(['code' => 'This membership plan code is already used in this organization.']);
        }

        MembershipPlan::query()->create([
            'organization_id' => $organizationId,
            'name' => $validated['name'],
            'code' => $code,
            'duration_days' => $validated['duration_days'],
            'price' => $validated['price'],
            'benefits' => collect(explode(',', (string) ($validated['benefits'] ?? '')))
                ->map(fn (string $benefit) => trim($benefit))
                ->filter()
                ->values()
                ->all(),
            'status' => $validated['status'],
        ]);

        return back()->with('success', 'CourtPrime membership plan created.');
    }

    public function storeMembership(PlayerMembershipStoreRequest $request, TenantContext $tenantContext, SubscriptionFeatureGate $subscriptionGate): RedirectResponse
    {
        $this->authorize('create', PlayerMembership::class);
        $subscriptionGate->ensureAnyFeatureEnabled($tenantContext->currentOrganization(), ['memberships'], 'memberships');

        $validated = $request->validated();
        $plan = MembershipPlan::query()->findOrFail($validated['membership_plan_id']);
        $organizationPlayer = OrganizationPlayer::query()
            ->withoutGlobalScope('organization')
            ->where('organization_id', $plan->organization_id)
            ->findOrFail($validated['organization_player_id']);

        PlayerMembership::query()->create([
            'organization_id' => $plan->organization_id,
            'membership_plan_id' => $plan->id,
            'organization_player_id' => $organizationPlayer->id,
            'player_profile_id' => $organizationPlayer->player_profile_id,
            'starts_on' => $validated['starts_on'],
            'ends_on' => CarbonImmutable::parse($validated['starts_on'])->addDays($plan->duration_days)->toDateString(),
            'status' => 'active',
            'auto_renew' => $validated['auto_renew'],
            'notes' => $validated['notes'] ?? null,
        ]);

        $organizationPlayer->legacyPlayer?->update(['membership_status' => 'member']);
        $organizationPlayer->update(['status' => 'active']);

        return back()->with('success', 'CourtPrime membership assigned.');
    }
}
