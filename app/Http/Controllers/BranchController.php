<?php

namespace App\Http\Controllers;

use App\Http\Requests\BranchStoreRequest;
use App\Models\Branch;
use App\Services\SubscriptionFeatureGate;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Branch::class);

        return Inertia::render('branches', [
            'branches' => Branch::query()
                ->with('photos')
                ->withCount(['courts', 'reservations'])
                ->latest()
                ->get()
                ->map(fn (Branch $branch) => [
                    ...$branch->toArray(),
                    /* Resolved URLs so the client never rebuilds storage paths. */
                    'photos' => $branch->photos->map(fn ($photo) => [
                        'id' => $photo->id,
                        'url' => $photo->url,
                        'caption' => $photo->caption,
                    ])->values(),
                ]),
        ]);
    }

    public function store(BranchStoreRequest $request, TenantContext $tenantContext, SubscriptionFeatureGate $subscriptionGate): RedirectResponse
    {
        $this->authorize('create', Branch::class);

        $organizationId = $tenantContext->currentOrganizationId();

        if (! $organizationId) {
            throw ValidationException::withMessages(['organization_id' => 'Select a CourtPrime organization workspace first.']);
        }

        $organization = $tenantContext->currentOrganization();

        if ($organization && ! $subscriptionGate->canCreateBranch($organization)) {
            throw ValidationException::withMessages(['name' => 'This CourtPrime subscription has reached its branch limit.']);
        }

        $validated = $request->validated();
        $code = strtoupper($validated['code']);

        if (Branch::query()->withoutGlobalScope('organization')->where('organization_id', $organizationId)->where('code', $code)->exists()) {
            throw ValidationException::withMessages(['code' => 'This branch code is already used in this organization.']);
        }

        Branch::query()->create([
            'organization_id' => $organizationId,
            'name' => $validated['name'],
            'code' => $code,
            'address' => $validated['address'] ?? null,
            'contact_number' => $validated['contact_number'] ?? null,
            'email' => $validated['email'] ?? null,
            'manager_name' => $validated['manager_name'] ?? null,
            'status' => 'active',
            'timezone' => $validated['timezone'],
            'currency' => strtoupper($validated['currency']),
            'tax_rate' => $validated['tax_rate'],
            'operating_hours' => [
                'opens' => $validated['opens_at'],
                'closes' => $validated['closes_at'],
            ],
        ]);

        return back()->with('success', 'CourtPrime branch created.');
    }
}
