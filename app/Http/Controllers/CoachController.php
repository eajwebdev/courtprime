<?php

namespace App\Http\Controllers;

use App\Http\Requests\CoachStoreRequest;
use App\Models\Branch;
use App\Models\Coach;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CoachController extends Controller
{
    public function index(TenantContext $tenantContext): Response
    {
        $this->authorize('viewAny', Coach::class);

        $organizationId = $tenantContext->currentOrganizationId();

        return Inertia::render('coaches', [
            'coaches' => Coach::query()
                ->with('branch:id,name')
                ->latest()
                ->paginate(20),
            'branches' => Branch::query()
                ->when($organizationId, fn ($query) => $query->where('organization_id', $organizationId))
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
        ]);
    }

    public function store(CoachStoreRequest $request, TenantContext $tenantContext): RedirectResponse
    {
        $this->authorize('create', Coach::class);

        $organizationId = $tenantContext->currentOrganizationId();

        if (! $organizationId) {
            throw ValidationException::withMessages(['organization_id' => 'Select a CourtPrime organization workspace first.']);
        }

        $validated = $request->validated();
        $branchId = $validated['branch_id'] ?? null;

        if ($branchId) {
            $branchBelongsToOrganization = Branch::query()
                ->where('id', $branchId)
                ->where('organization_id', $organizationId)
                ->exists();

            abort_unless($branchBelongsToOrganization, 403);
        }

        Coach::query()->create([
            'organization_id' => $organizationId,
            'branch_id' => $branchId,
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'mobile_number' => $validated['mobile_number'] ?? null,
            'specialties' => collect(explode(',', (string) ($validated['specialties'] ?? '')))
                ->map(fn (string $specialty) => trim($specialty))
                ->filter()
                ->values()
                ->all(),
            'hourly_rate' => $validated['hourly_rate'],
            'bio' => $validated['bio'] ?? null,
            'status' => $validated['status'],
        ]);

        return back()->with('success', 'CourtPrime coach saved.');
    }
}
