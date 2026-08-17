<?php

namespace App\Http\Controllers;

use App\Http\Requests\ApiCredentialStoreRequest;
use App\Models\ApiCredential;
use App\Models\Organization;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ApiCredentialController extends Controller
{
    public function index(TenantContext $tenantContext): Response
    {
        $this->authorize('viewAny', ApiCredential::class);
        $organization = $tenantContext->currentOrganization();

        abort_unless($organization, 403);

        return Inertia::render('api-credentials', [
            'enabled' => $this->apiEnabled($organization),
            'credentials' => ApiCredential::query()
                ->with(['creator:id,name', 'revoker:id,name'])
                ->latest()
                ->paginate(20),
            'abilities' => [
                'reservations:read',
                'courts:read',
                'scores:read',
                'tournaments:read',
                'players:read',
                'rankings:read',
            ],
        ]);
    }

    public function store(ApiCredentialStoreRequest $request, TenantContext $tenantContext): RedirectResponse
    {
        $this->authorize('create', ApiCredential::class);
        $organization = $tenantContext->currentOrganization();

        abort_unless($organization, 403);

        if (! $this->apiEnabled($organization)) {
            throw ValidationException::withMessages(['api' => 'Enable API access in organization settings or assign an API-enabled plan first.']);
        }

        $validated = $request->validated();
        $plain = 'cp_'.Str::random(48);

        ApiCredential::query()->create([
            'organization_id' => $organization->id,
            'name' => $validated['name'],
            'token_prefix' => substr($plain, 0, 12),
            'token_hash' => hash('sha256', $plain),
            'abilities' => $validated['abilities'],
            'expires_at' => $validated['expires_at'] ?? null,
            'created_by' => $request->user()->id,
            'status' => 'active',
        ]);

        return back()
            ->with('success', 'CourtPrime API credential created.')
            ->with('api_token_once', $plain);
    }

    public function revoke(ApiCredential $apiCredential): RedirectResponse
    {
        $this->authorize('update', $apiCredential);

        $apiCredential->update([
            'status' => 'revoked',
            'revoked_at' => now(),
            'revoked_by' => auth()->id(),
        ]);

        return back()->with('success', 'CourtPrime API credential revoked.');
    }

    private function apiEnabled(Organization $organization): bool
    {
        $organization->loadMissing('subscription.plan.features');

        return (bool) ($organization->settings['api_access_enabled'] ?? false)
            || $organization->subscription?->plan?->features->firstWhere('feature_key', 'api_access')?->enabled === true
            || auth()->user()?->is_superadmin;
    }
}
