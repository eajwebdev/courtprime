<?php

use App\Models\ClubMatch;
use App\Models\Branch;
use App\Models\Court;
use App\Models\Tournament;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('organization.{organizationId}', function (User $user, int $organizationId) {
    return app(TenantContext::class)->canAccessOrganization($organizationId);
});

Broadcast::channel('branch.{branchId}', function (User $user, int $branchId) {
    $tenantContext = app(TenantContext::class);
    $activeBranchId = $tenantContext->currentBranchId();

    if ($activeBranchId && $activeBranchId !== $branchId) {
        return false;
    }

    return Branch::query()
        ->withoutGlobalScope('organization')
        ->whereKey($branchId)
        ->where('organization_id', $tenantContext->currentOrganizationId())
        ->exists();
});

Broadcast::channel('court.{courtId}', function (User $user, int $courtId) {
    $tenantContext = app(TenantContext::class);

    return Court::query()
        ->withoutGlobalScope('organization')
        ->whereKey($courtId)
        ->where('organization_id', $tenantContext->currentOrganizationId())
        ->when($tenantContext->currentBranchId(), fn ($query) => $query->where('branch_id', $tenantContext->currentBranchId()))
        ->exists();
});

Broadcast::channel('match.{matchId}', function (User $user, int $matchId) {
    $tenantContext = app(TenantContext::class);

    return ClubMatch::query()
        ->withoutGlobalScope('organization')
        ->whereKey($matchId)
        ->where('organization_id', $tenantContext->currentOrganizationId())
        ->exists();
});

Broadcast::channel('tournament.{tournamentId}', function (User $user, int $tournamentId) {
    $tenantContext = app(TenantContext::class);

    return Tournament::query()
        ->withoutGlobalScope('organization')
        ->whereKey($tournamentId)
        ->where('organization_id', $tenantContext->currentOrganizationId())
        ->exists();
});
