<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Services\Payments\PayMongoQrPh;
use App\Services\SubscriptionBillingService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Throwable;

/**
 * What a club owes, and how it pays.
 *
 * The club's own view of its subscription: where the trial is up to, what the
 * next bill is, how long it has to pay it, and the terms it could switch to.
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
        $plans = SubscriptionPlan::query()->where('is_active', true)->orderBy('monthly_price')->get();

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
            'plans' => $plans->map(fn (SubscriptionPlan $plan) => [
                'id' => $plan->id,
                'code' => $plan->code,
                'name' => $plan->name,
                'description' => $plan->description,
                'terms' => $this->billing->termOptions($plan),
            ])->all(),
            'invoices' => $subscription
                ? $subscription->invoices()->orderByDesc('id')->limit(12)->get()->map(fn (SubscriptionInvoice $invoice) => [
                    'number' => $invoice->invoice_number,
                    'period' => $invoice->period_starts_on?->toDateString().' to '.$invoice->period_ends_on?->toDateString(),
                    'total' => (float) $invoice->total_amount,
                    'status' => $invoice->status,
                    'paid_at' => $invoice->paid_at?->toDateString(),
                ])->all()
                : [],
            'trialDays' => SubscriptionBillingService::TRIAL_DAYS,
            /* From BILLING_CYCLE_MONTHS, so the term picker opens on the term
               the club is set up to default to rather than always monthly. */
            'defaultTermMonths' => $this->billing->defaultTermMonths(),
            /* The page says plainly when payment cannot be taken yet, rather
               than offering a button that throws. */
            'canTakePayment' => $this->gateway->configured(),
        ]);
    }

    /** Start the fourteen day trial, which is how partner clubs come on. */
    public function trial(Request $request, TenantContext $tenantContext): RedirectResponse
    {
        $organization = $tenantContext->currentOrganization();
        $this->authorize('manage', $organization);

        $plan = SubscriptionPlan::query()->findOrFail($request->integer('plan_id'));

        if ($organization->subscription?->trial_ends_at) {
            return back()->withErrors(['plan_id' => 'This club has already had its trial.']);
        }

        $this->billing->startTrial($organization, $plan);

        return back()->with('success', 'Trial started. Everything is unlocked for '.SubscriptionBillingService::TRIAL_DAYS.' days.');
    }

    /** Choose a plan and a term, and raise the bill for it. */
    public function subscribe(Request $request, TenantContext $tenantContext): RedirectResponse
    {
        $organization = $tenantContext->currentOrganization();
        $this->authorize('manage', $organization);

        $data = $request->validate([
            'plan_id' => ['required', 'integer', 'exists:subscription_plans,id'],
            'term_months' => ['required', 'integer', 'in:1,3,12'],
        ]);

        $plan = SubscriptionPlan::query()->findOrFail($data['plan_id']);

        $this->billing->subscribe($organization, $plan, (int) $data['term_months']);

        return back()->with('success', 'Subscription started. The invoice is ready to pay.');
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
