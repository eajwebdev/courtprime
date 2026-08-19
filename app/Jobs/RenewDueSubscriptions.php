<?php

namespace App\Jobs;

use App\Models\Subscription;
use App\Services\SubscriptionBillingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Roll a subscription into its next period the day the current one ends.
 *
 * This is what "auto create the next billing due date" means: nobody has to
 * come back and re-subscribe by hand. The subscription moves to past_due and
 * the next invoice is raised the same way SubscriptionBillingService::renew()
 * always has, this is just what calls it without a click.
 */
class RenewDueSubscriptions implements ShouldQueue
{
    use Queueable;

    public function handle(SubscriptionBillingService $billing): void
    {
        Subscription::query()
            ->where('status', 'active')
            ->whereDate('current_period_ends_at', '<=', today())
            ->with('plan')
            ->limit(500)
            ->get()
            ->each(fn (Subscription $subscription) => $billing->renew($subscription));
    }
}
