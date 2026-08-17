<?php

namespace App\Policies;

use App\Enums\PlatformRole;
use App\Models\User;
use App\Services\TenantContext;

class TenantResourcePolicy
{
    public function viewAny(User $user): bool
    {
        return $this->hasTenantAccess($user);
    }

    public function view(User $user, object $model): bool
    {
        return $this->canAccessModel($user, $model);
    }

    public function create(User $user): bool
    {
        return $this->hasTenantAccess($user);
    }

    public function update(User $user, object $model): bool
    {
        return $this->canAccessModel($user, $model);
    }

    public function delete(User $user, object $model): bool
    {
        return $this->canAccessModel($user, $model)
            && in_array(app(TenantContext::class)->activeRole(), [
                PlatformRole::EajSuperadmin,
                PlatformRole::OrganizationOwner,
                PlatformRole::BranchManager,
            ], true);
    }

    private function hasTenantAccess(User $user): bool
    {
        if ($user->is_superadmin) {
            return true;
        }

        $role = app(TenantContext::class)->activeRole() ?? PlatformRole::tryFrom($user->role_key);

        return $role?->isTenantRole() === true && app(TenantContext::class)->currentOrganizationId() !== null;
    }

    private function canAccessModel(User $user, object $model): bool
    {
        if ($user->is_superadmin) {
            return true;
        }

        if (! property_exists($model, 'organization_id') && ! isset($model->organization_id)) {
            return false;
        }

        $tenantContext = app(TenantContext::class);
        $organizationId = (int) $model->organization_id;

        if ($tenantContext->currentOrganizationId() !== $organizationId || ! $tenantContext->canAccessOrganization($organizationId)) {
            return false;
        }

        $branchId = $tenantContext->currentBranchId();

        if ($branchId && isset($model->branch_id) && (int) $model->branch_id !== $branchId) {
            return false;
        }

        return true;
    }
}
