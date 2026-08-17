<?php

namespace App\Services;

use App\Enums\PlatformRole;
use App\Models\Branch;
use App\Models\Organization;
use App\Models\OrganizationUserRole;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class TenantContext
{
    public function __construct(private readonly Request $request)
    {
    }

    public function user(): ?User
    {
        return $this->request->user() ?? auth()->user();
    }

    public function currentOrganizationId(): ?int
    {
        $user = $this->user();

        if (! $user) {
            return null;
        }

        if ($user->is_superadmin) {
            return $this->sessionInteger('courtprime.workspace.organization_id');
        }

        $workspaceOrganizationId = $this->sessionInteger('courtprime.workspace.organization_id');

        if ($workspaceOrganizationId && $this->canAccessOrganization($workspaceOrganizationId)) {
            return $workspaceOrganizationId;
        }

        return $user->organization_id;
    }

    public function currentBranchId(): ?int
    {
        $branchId = $this->sessionInteger('courtprime.workspace.branch_id');
        $organizationId = $this->currentOrganizationId();

        if (! $branchId || ! $organizationId) {
            return $this->user()?->branch_id;
        }

        return Branch::query()
            ->withoutGlobalScope('organization')
            ->whereKey($branchId)
            ->where('organization_id', $organizationId)
            ->exists() ? $branchId : $this->user()?->branch_id;
    }

    public function currentBranch(): ?Branch
    {
        $branchId = $this->currentBranchId();
        $organizationId = $this->currentOrganizationId();

        if (! $branchId || ! $organizationId) {
            return null;
        }

        return Branch::query()
            ->withoutGlobalScope('organization')
            ->whereKey($branchId)
            ->where('organization_id', $organizationId)
            ->first();
    }

    public function currentOrganization(): ?Organization
    {
        $organizationId = $this->currentOrganizationId();

        if (! $organizationId) {
            return null;
        }

        return Organization::query()->find($organizationId);
    }

    public function activeRole(): ?PlatformRole
    {
        $user = $this->user();

        if (! $user) {
            return null;
        }

        if ($user->is_superadmin) {
            return PlatformRole::EajSuperadmin;
        }

        $role = OrganizationUserRole::query()
            ->withoutGlobalScope('organization')
            ->where('user_id', $user->id)
            ->where('organization_id', $this->currentOrganizationId())
            ->where('status', 'active')
            ->orderByDesc('is_primary')
            ->first();

        return $role?->role_key ?? PlatformRole::tryFrom($user->role_key);
    }

    public function canAccessOrganization(int $organizationId): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        if ($user->is_superadmin) {
            return Organization::query()->whereKey($organizationId)->exists();
        }

        if ((int) $user->organization_id === $organizationId) {
            return true;
        }

        return OrganizationUserRole::query()
            ->withoutGlobalScope('organization')
            ->where('user_id', $user->id)
            ->where('organization_id', $organizationId)
            ->where('status', 'active')
            ->exists();
    }

    /**
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    public function workspaces(): Collection
    {
        $user = $this->user();

        if (! $user) {
            return collect();
        }

        if ($user->is_superadmin) {
            return Organization::query()
                ->orderBy('name')
                ->get()
                ->map(fn (Organization $organization) => [
                    'organization_id' => $organization->id,
                    'branch_id' => null,
                    'label' => $organization->name,
                    'role' => PlatformRole::EajSuperadmin->value,
                    'role_label' => PlatformRole::EajSuperadmin->label(),
                ]);
        }

        $roles = OrganizationUserRole::query()
            ->withoutGlobalScope('organization')
            ->with(['organization', 'branch'])
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->get();

        if ($roles->isEmpty() && $user->organization) {
            return collect([[
                'organization_id' => $user->organization_id,
                'branch_id' => $user->branch_id,
                'label' => $user->organization->name,
                'role' => $user->role_key,
                'role_label' => PlatformRole::tryFrom($user->role_key)?->label() ?? str($user->role_key)->headline()->toString(),
            ]]);
        }

        return $roles->map(fn (OrganizationUserRole $role) => [
            'organization_id' => $role->organization_id,
            'branch_id' => $role->branch_id,
            'label' => $role->branch
                ? $role->organization->name.' / '.$role->branch->name
                : $role->organization->name,
            'role' => $role->role_key->value,
            'role_label' => $role->role_key->label(),
        ])->values();
    }

    /**
     * @return array<string, mixed>
     */
    public function inertiaShare(): array
    {
        $organization = $this->currentOrganization();
        $branch = $this->currentBranch();
        $role = $this->activeRole();

        return [
            'current' => [
                'organization_id' => $organization?->id,
                'organization_name' => $organization?->name,
                'organization_demo_mode' => $organization?->demo_mode ?? false,
                'branch_id' => $branch?->id,
                'branch_name' => $branch?->name,
                'label' => $organization
                    ? $organization->name.($branch ? ' / '.$branch->name : '')
                    : null,
                'role' => $role?->value,
                'role_label' => $role?->label(),
            ],
            'available' => $this->workspaces()->all(),
        ];
    }

    private function sessionInteger(string $key): ?int
    {
        if (! $this->request->hasSession()) {
            return null;
        }

        $value = $this->request->session()->get($key);

        return is_numeric($value) ? (int) $value : null;
    }
}
