<?php

namespace App\Http\Controllers;

use App\Enums\PlatformRole;
use App\Http\Requests\TeamRoleStoreRequest;
use App\Models\Branch;
use App\Models\Organization;
use App\Models\OrganizationUserRole;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TeamRoleController extends Controller
{
    public function index(TenantContext $tenantContext): Response
    {
        abort_unless($tenantContext->activeRole()?->canManageTenant(), 403);

        $organizationId = $tenantContext->currentOrganizationId();
        $branchId = $tenantContext->currentBranchId();

        return Inertia::render('team-roles', [
            'assignments' => OrganizationUserRole::query()
                ->withoutGlobalScope('organization')
                ->with(['user', 'organization', 'branch'])
                ->when(! auth()->user()?->is_superadmin, fn ($query) => $query->where('organization_id', $organizationId))
                ->when($branchId, fn ($query) => $query->where(fn ($query) => $query->whereNull('branch_id')->orWhere('branch_id', $branchId)))
                ->latest()
                ->paginate(20)
                ->through(fn (OrganizationUserRole $assignment) => [
                    'id' => $assignment->id,
                    'role_key' => $assignment->role_key->value,
                    'role_label' => $assignment->role_key->label(),
                    'status' => $assignment->status,
                    'is_primary' => $assignment->is_primary,
                    'user' => [
                        'id' => $assignment->user?->id,
                        'name' => $assignment->user?->name,
                        'email' => $assignment->user?->email,
                    ],
                    'organization' => [
                        'id' => $assignment->organization?->id,
                        'name' => $assignment->organization?->name,
                    ],
                    'branch' => $assignment->branch ? [
                        'id' => $assignment->branch->id,
                        'name' => $assignment->branch->name,
                        'code' => $assignment->branch->code,
                    ] : null,
                ]),
            'users' => User::query()
                ->when(! auth()->user()?->is_superadmin, fn ($query) => $query->where(fn ($query) => $query->whereNull('organization_id')->orWhere('organization_id', $organizationId)))
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'organization_id', 'branch_id', 'role_key']),
            'organizations' => Organization::query()
                ->when(! auth()->user()?->is_superadmin, fn ($query) => $query->whereKey($organizationId))
                ->orderBy('name')
                ->get(['id', 'name']),
            'branches' => Branch::query()
                ->withoutGlobalScope('organization')
                ->when($organizationId, fn ($query) => $query->where('organization_id', $organizationId))
                ->when($branchId, fn ($query) => $query->whereKey($branchId))
                ->orderBy('name')
                ->get(['id', 'organization_id', 'name', 'code']),
            'roles' => collect(PlatformRole::cases())
                ->reject(fn (PlatformRole $role) => $role === PlatformRole::EajSuperadmin && ! auth()->user()?->is_superadmin)
                ->reject(fn (PlatformRole $role) => $role === PlatformRole::Player)
                ->map(fn (PlatformRole $role) => ['value' => $role->value, 'label' => $role->label()])
                ->values(),
        ]);
    }

    public function store(TeamRoleStoreRequest $request, TenantContext $tenantContext): RedirectResponse
    {
        $validated = $request->validated();
        $organizationId = $this->organizationId($validated, $tenantContext);
        $branchId = $this->branchId($validated, $organizationId, $tenantContext);
        $user = $this->resolveUser($validated);
        $role = PlatformRole::from($validated['role_key']);

        if ($role === PlatformRole::EajSuperadmin && ! $request->user()->is_superadmin) {
            throw ValidationException::withMessages(['role_key' => 'Only EAJ Superadmins can assign the EAJ Superadmin role.']);
        }

        if ($validated['is_primary'] ?? false) {
            OrganizationUserRole::query()
                ->withoutGlobalScope('organization')
                ->where('user_id', $user->id)
                ->update(['is_primary' => false]);
        }

        OrganizationUserRole::query()
            ->withoutGlobalScope('organization')
            ->updateOrCreate(
                [
                    'user_id' => $user->id,
                    'organization_id' => $organizationId,
                    'branch_id' => $branchId,
                    'role_key' => $role->value,
                ],
                [
                    'status' => 'active',
                    'is_primary' => (bool) ($validated['is_primary'] ?? false),
                ],
            );

        $user->fill([
            'organization_id' => $user->organization_id ?: $organizationId,
            'branch_id' => $user->branch_id ?: $branchId,
            'role_key' => ($validated['is_primary'] ?? false) ? $role->value : $user->role_key,
            'is_superadmin' => $role === PlatformRole::EajSuperadmin ? true : $user->is_superadmin,
        ])->save();

        return back()->with('success', 'CourtPrime role assignment saved.');
    }

    public function destroy(OrganizationUserRole $organizationUserRole, TenantContext $tenantContext): RedirectResponse
    {
        abort_unless($tenantContext->activeRole()?->canManageTenant(), 403);
        $this->authorize('update', $organizationUserRole);

        $organizationUserRole->update([
            'status' => 'inactive',
            'is_primary' => false,
        ]);

        return back()->with('success', 'CourtPrime role assignment deactivated.');
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function organizationId(array $validated, TenantContext $tenantContext): int
    {
        $organizationId = auth()->user()?->is_superadmin
            ? (int) ($validated['organization_id'] ?? $tenantContext->currentOrganizationId())
            : (int) $tenantContext->currentOrganizationId();

        if (! $organizationId || ! $tenantContext->canAccessOrganization($organizationId)) {
            throw ValidationException::withMessages(['organization_id' => 'Select an authorized CourtPrime organization.']);
        }

        return $organizationId;
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function branchId(array $validated, int $organizationId, TenantContext $tenantContext): ?int
    {
        $branchId = isset($validated['branch_id']) ? (int) $validated['branch_id'] : null;
        $activeBranchId = $tenantContext->currentBranchId();

        if ($activeBranchId && $branchId && $branchId !== $activeBranchId) {
            throw ValidationException::withMessages(['branch_id' => 'You can only assign users inside your current branch workspace.']);
        }

        if (! $branchId) {
            return $activeBranchId;
        }

        $exists = Branch::query()
            ->withoutGlobalScope('organization')
            ->whereKey($branchId)
            ->where('organization_id', $organizationId)
            ->exists();

        if (! $exists) {
            throw ValidationException::withMessages(['branch_id' => 'Select a branch inside the selected organization.']);
        }

        return $branchId;
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function resolveUser(array $validated): User
    {
        if (! empty($validated['user_id'])) {
            return User::query()->findOrFail($validated['user_id']);
        }

        return User::query()->firstOrCreate(
            ['email' => Str::lower((string) $validated['email'])],
            [
                'name' => $validated['name'],
                'password' => Hash::make(Str::random(32)),
                'role_key' => PlatformRole::Player->value,
            ],
        );
    }
}
