<?php

namespace App\Jobs;

use App\Models\CourtPrimeNotification;
use App\Models\SubscriptionInvoice;
use App\Models\User;
use App\Notifications\SubscriptionInvoiceDueNotification;
use App\Services\SubscriptionBillingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Nudge a club before its bill falls due.
 *
 * BILLING_NOTIFY_DAYS out from `due_on`, once per invoice: reminder_sent_at is
 * what stops this resending every time the schedule runs between now and the
 * due date.
 */
class SendSubscriptionBillingReminders implements ShouldQueue
{
    use Queueable;

    public function handle(SubscriptionBillingService $billing): void
    {
        $window = today()->addDays($billing->notifyDaysBeforeDue());

        SubscriptionInvoice::query()
            ->whereNull('reminder_sent_at')
            ->whereIn('status', ['issued', 'overdue', 'partial'])
            ->whereDate('due_on', '<=', $window)
            ->whereDate('due_on', '>=', today())
            ->orderBy('due_on')
            ->limit(500)
            ->get()
            ->each(fn (SubscriptionInvoice $invoice) => $this->notify($invoice));
    }

    private function notify(SubscriptionInvoice $invoice): void
    {
        /* The club's own owner, not whoever happens to be signed in when the
           schedule runs, since nobody is signed in when the schedule runs. */
        $owner = User::query()
            ->where('organization_id', $invoice->organization_id)
            ->where('role_key', 'organization_owner')
            ->first();

        CourtPrimeNotification::query()->create([
            'organization_id' => $invoice->organization_id,
            'user_id' => $owner?->id,
            'category' => 'billing',
            'channel' => 'app',
            'title' => 'Subscription due '.$invoice->due_on?->toFormattedDateString(),
            'body' => 'Invoice '.$invoice->invoice_number.' for ₱'.number_format((float) $invoice->total_amount, 2).' is due soon.',
            'data' => ['url' => '/billing', 'invoice_id' => $invoice->id],
        ]);

        $owner?->notify(new SubscriptionInvoiceDueNotification($invoice));
        $invoice->update(['reminder_sent_at' => now()]);
    }
}
