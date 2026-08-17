<?php

namespace App\Services;

use App\Models\Branch;
use Carbon\CarbonImmutable;
use DateTimeZone;
use Throwable;

class BranchClock
{
    public function __construct(private readonly TenantContext $tenantContext)
    {
    }

    public function timezone(?Branch $branch = null): string
    {
        $timezone = $branch?->timezone
            ?? $this->tenantContext->currentBranch()?->timezone
            ?? $this->tenantContext->currentOrganization()?->timezone
            ?? config('app.timezone', 'UTC');

        try {
            new DateTimeZone($timezone);

            return $timezone;
        } catch (Throwable) {
            return config('app.timezone', 'UTC');
        }
    }

    public function now(?Branch $branch = null): CarbonImmutable
    {
        return CarbonImmutable::now($this->timezone($branch));
    }

    public function today(?Branch $branch = null): CarbonImmutable
    {
        return $this->now($branch)->startOfDay();
    }

    /**
     * @return array{0: \Carbon\CarbonImmutable, 1: \Carbon\CarbonImmutable}
     */
    public function dayRange(?CarbonImmutable $localDate = null, ?Branch $branch = null): array
    {
        $date = $localDate ?? $this->today($branch);
        $start = $date->timezone($this->timezone($branch))->startOfDay();
        $end = $date->endOfDay();

        return [$start->utc(), $end->utc()];
    }
}
