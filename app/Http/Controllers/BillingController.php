<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionInvoice;
use App\Services\Payments\PayMongoQrPh;
use App\Services\SubscriptionBillingService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Throwable;

/**
 * What a club owes, and how it pays.
 *
 * View and pay only. Choosing a plan, a term, or starting a trial is EAJ's
 * call, made from /tenant-subscriptions, the same as it already decides who
 * is on the network at all; a club cannot grant itself a trial or downgrade
 * its own bill. This page answers what the club owes and lets it clear that
 * with QRPh, nothing more.
 */
class BillingController extends Controller
{
    public function __construct(
        private readonly SubscriptionBillingService $billing,
        private readonly PayMongoQrPh $gateway,
    ) {}

    public function index(TenantContext $tenantContext): Response
    {
        $organization = $tenantContext->currentOrganization();

        if (! $organization) {
            throw ValidationException::withMessages(['organization_id' => 'Select a CourtPrime organization workspace first.']);
        }

        $this->authorize('manage', $organization);

        $subscription = $organization->subscription()->with('plan')->first();

        $outstanding = $subscription
            ? $subscription->invoices()->whereIn('status', ['issued', 'overdue', 'partial'])->orderByDesc('id')->first()
            : null;

        return Inertia::render('billing', [
            'subscription' => $subscription ? [
                'status' => $subscription->status,
                'plan' => $subscription->plan?->name,
                'plan_code' => $subscription->plan?->code,
                'term_months' => (int) $subscription->term_months,
                'trial_ends_at' => $subscription->trial_ends_at?->toDateString(),
                'period_starts_at' => $subscription->current_period_starts_at?->toDateString(),
                'period_ends_at' => $subscription->current_period_ends_at?->toDateString(),
                'grace_ends_on' => $this->billing->graceEndsOn($subscription)?->toDateString(),
                'has_access' => $this->billing->hasAccess($subscription),
            ] : null,
            'outstanding' => $outstanding ? [
                'id' => $outstanding->id,
                'number' => $outstanding->invoice_number,
                'total' => (float) $outstanding->total_amount,
                'due_on' => $outstanding->due_on?->toDateString(),
                'grace_ends_on' => $outstanding->grace_ends_on?->toDateString(),
                'reference' => $outstanding->payment_reference,
            ] : null,
            'invoices' => $subscription
                ? $subscription->invoices()->orderByDesc('id')->limit(12)->get()->map(fn (SubscriptionInvoice $invoice) => [
                    'number' => $invoice->invoice_number,
                    'period' => $invoice->period_starts_on?->toDateString().' to '.$invoice->period_ends_on?->toDateString(),
                    'total' => (float) $invoice->total_amount,
                    'status' => $invoice->status,
                    'paid_at' => $invoice->paid_at?->toDateString(),
                ])->all()
                : [],
            /* The page says plainly when payment cannot be taken yet, rather
               than offering a button that throws. */
            'canTakePayment' => $this->gateway->configured(),
        ]);
    }

    /** Raise a QRPh code for the outstanding invoice. */
    public function pay(SubscriptionInvoice $invoice, TenantContext $tenantContext): RedirectResponse
    {
        $organization = $tenantContext->currentOrganization();
        $this->authorize('manage', $organization);

        abort_unless($invoice->organization_id === $organization->id, 403);

        try {
            $payment = $this->gateway->createPayment($invoice);
        } catch (RuntimeException $exception) {
            return back()->withErrors(['payment' => $exception->getMessage()]);
        } catch (Throwable) {
            return back()->withErrors(['payment' => 'Could not reach PayMongo. Try again in a moment.']);
        }

        $invoice->update([
            'payment_method' => 'qrph',
            'payment_reference' => $payment['reference'],
        ]);

        /*
         * Not marked paid here. QRPh settles asynchronously, so the club has a
         * QR and the money has not moved yet; the webhook is what confirms it.
         */
        return back()->with('success', 'Scan the QR to pay. The subscription updates once the payment clears.')
            ->with('qr', $payment['qr_image'] ?? $payment['redirect']);
    }
}
