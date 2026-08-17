<?php

namespace App\Services;

use App\Models\Organization;
use Illuminate\Validation\ValidationException;

class SubscriptionFeatureGate
{
    public function canCreateBranch(Organization $organization): bool
    {
        $limit = $organization->subscription?->plan?->branch_limit;

        return $limit === null || $organization->branches()->count() < $limit;
    }

    public function canCreateCourt(Organization $organization): bool
    {
        $limit = $organization->subscription?->plan?->court_limit;

        return $limit === null || $organization->courts()->count() < $limit;
    }

    public function featureEnabled(Organization $organization, string $featureKey): bool
    {
        $plan = $organization->subscription?->plan;

        if (! $plan) {
            return true;
        }

        return $plan->features()->where('feature_key', $featureKey)->where('enabled', true)->exists();
    }

    /**
     * @param  array<int, string>  $featureKeys
     */
    public function anyFeatureEnabled(?Organization $organization, array $featureKeys): bool
    {
        if (! $organization) {
            return true;
        }

        $plan = $organization->subscription?->plan;

        if (! $plan) {
            return true;
        }

        return $plan->features()
            ->whereIn('feature_key', $featureKeys)
            ->where('enabled', true)
            ->exists();
    }

    /**
     * @param  array<int, string>  $featureKeys
     */
    public function ensureAnyFeatureEnabled(?Organization $organization, array $featureKeys, string $label): void
    {
        if (! $this->anyFeatureEnabled($organization, $featureKeys)) {
            throw ValidationException::withMessages([
                'subscription' => "The current CourtPrime subscription does not include {$label}.",
            ]);
        }
    }
}
