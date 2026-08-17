<?php

namespace App\Models\Concerns;

use App\Services\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

trait BelongsToOrganization
{
    protected static function bootBelongsToOrganization(): void
    {
        static::addGlobalScope('organization', function (Builder $builder) {
            $tenantContext = app(TenantContext::class);
            $user = $tenantContext->user();
            $organizationId = $tenantContext->currentOrganizationId();

            if (! $user || ! $organizationId) {
                return;
            }

            $builder->where($builder->getModel()->getTable().'.organization_id', $organizationId);
        });

        static::creating(function (Model $model) {
            $tenantContext = app(TenantContext::class);
            $user = $tenantContext->user();
            $organizationId = $tenantContext->currentOrganizationId();

            if ($user && $organizationId && ! $model->organization_id) {
                $model->organization_id = $organizationId;
            }
        });
    }
}
