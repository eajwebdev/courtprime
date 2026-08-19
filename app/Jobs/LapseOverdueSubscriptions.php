<?php

namespace App\Jobs;

use App\Models\Subscription;
use App\Services\SubscriptionBillingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Switch a club off once its grace days have genuinely run out.
 *
 * hasAccess() already computes this live from the invoice's grace_ends_on, so
 * gating is correct with or without this job. What this job does is flip the
 * status column to match, so the billing page, admin lists and anything else
 * that reads `status` directly are not still saying past_due days after the
 * club actually lost access.
 */
class LapseOverdueSubscriptions implements ShouldQueue
{
    use Queueable;

    public function handle(SubscriptionBillingService $billing): void
    {
        Subscription::query()
            ->where('status', 'past_due')
            ->limit(500)
            ->get()
            ->each(function (Subscription $subscription) use ($billing) {
                if (! $billing->hasAccess($subscription)) {
                    $billing->lapse($subscription);
                }
            });
    }
}
