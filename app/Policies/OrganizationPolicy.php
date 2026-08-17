<?php

namespace App\Policies;

use App\Models\Organization;
use App\Models\User;
use App\Services\TenantContext;

class OrganizationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_superadmin;
    }

    public function view(User $user, Organization $organization): bool
    {
        return app(TenantContext::class)->canAccessOrganization($organization->id);
    }

    public function manage(User $user, Organization $organization): bool
    {
        $role = app(TenantContext::class)->activeRole();

        return $role?->canManageTenant() === true
            && app(TenantContext::class)->canAccessOrganization($organization->id);
    }
}
