<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubscriptionInvoiceStoreRequest;
use App\Http\Requests\SubscriptionPaymentStoreRequest;
use App\Http\Requests\TenantSubscriptionUpdateRequest;
use App\Models\Organization;
use App\Models\Subscription;
use App\Models\SubscriptionEvent;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPayment;
use App\Models\SubscriptionPlan;
use App\Services\Payments\PayMongoQrPh;
use App\Services\SubscriptionBillingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * EAJ's own control of every club's subscription.
 *
 * This is where a trial starts and a plan and term are chosen. A club does not
 * grant itself a trial or pick its own plan any more than it adds itself to the
 * network; /billing is the club's own page, and it only shows what is owed and
 * lets them clear it by QRPh.
 */
class TenantSubscriptionController extends Controller
{
    public function __construct(
        private readonly SubscriptionBillingService $billing,
        private readonly PayMongoQrPh $gateway,
    ) {}

    public function index(): Response
    {
        abort_unless(auth()->user()?->is_superadmin, 403);

        $plans = SubscriptionPlan::query()->where('is_active', true)->orderBy('monthly_price')->get();

        return Inertia::render('tenant-subscriptions', [
            'organizations' => Organization::query()
                ->with([
                    'subscription.plan',
                    'subscription.invoices' => fn ($query) => $query->latest('issued_on')->limit(5),
                    'subscription.payments' => fn ($query) => $query->latest('paid_at')->limit(5),
                    'subscription.events' => fn ($query) => $query->latest('occurred_at')->limit(5),
                ])
                ->withCount(['branches', 'courts', 'users'])
                ->orderBy('name')
                ->get()
                ->map(function (Organization $organization) {
                    $subscription = $organization->subscription;

                    return [
                        ...$organization->toArray(),
                        /*
                         * Read live rather than trusted from the status
                         * column: the manual override form further down this
                         * page still writes the older trial/grace_period/
                         * expired vocabulary, and the two do not agree on
                         * every value, so the column alone cannot be trusted
                         * for whether the club actually has access right now.
                         */
                        'has_access' => $subscription ? $this->billing->hasAccess($subscription) : true,
                        'grace_ends_on' => $subscription ? $this->billing->graceEndsOn($subscription)?->toDateString() : null,
                    ];
                }),
            'plans' => $plans->map(fn (SubscriptionPlan $plan) => [
                'id' => $plan->id,
                'code' => $plan->code,
                'name' => $plan->name,
                'monthly_price' => $plan->monthly_price,
                'branch_limit' => $plan->branch_limit,
                'court_limit' => $plan->court_limit,
                'staff_limit' => $plan->staff_limit,
                /* What each term costs and saves, so the discount for
                   committing annually is visible from the same screen that
                   decides the term. */
                'terms' => $this->billing->termOptions($plan),
            ]),
            'trialDays' => SubscriptionBillingService::TRIAL_DAYS,
            'canTakePayment' => $this->gateway->configured(),
        ]);
    }

    /**
     * Start a club's free trial.
     *
     * This is the only way a trial starts. A club cannot grant itself one from
     * its own billing page.
     */
    public function startTrial(Request $request, Organization $organization): RedirectResponse
    {
        abort_unless(auth()->user()?->is_superadmin, 403);

        $data = $request->validate(['plan_id' => ['required', 'integer', 'exists:subscription_plans,id']]);
        $plan = SubscriptionPlan::query()->findOrFail($data['plan_id']);

        if ($organization->subscription?->trial_ends_at) {
            return back()->withErrors(['plan_id' => 'This club has already had its trial.']);
        }

        $this->billing->startTrial($organization, $plan);

        return back()->with('success', $organization->name.' is on trial for '.SubscriptionBillingService::TRIAL_DAYS.' days.');
    }

    /**
     * Put a club on a paid plan and term, and raise the first bill.
     *
     * The club settles it themselves from its own billing page by QRPh; this
     * only decides what they are being asked to pay for.
     */
    public function subscribeTenant(Request $request, Organization $organization): RedirectResponse
    {
        abort_unless(auth()->user()?->is_superadmin, 403);

        $data = $request->validate([
            'plan_id' => ['required', 'integer', 'exists:subscription_plans,id'],
            'term_months' => ['required', 'integer', 'in:1,3,12'],
        ]);

        $plan = SubscriptionPlan::query()->findOrFail($data['plan_id']);

        $this->billing->subscribe($organization, $plan, (int) $data['term_months']);

        return back()->with('success', $organization->name.' is on '.$plan->name.'. The invoice is ready for them to pay.');
    }

    /**
     * Record a payment taken outside QRPh: cash at a meeting, a bank transfer,
     * against a specific invoice.
     *
     * Goes through the same settle() an online payment does, so the period
     * rolls forward and the next due date is set the same way either path
     * pays. The older payment() method further down this file records money
     * without doing that; this is the one to use for anything that is meant
     * to keep the subscription current.
     */
    public function settleInvoice(Request $request, Organization $organization, SubscriptionInvoice $invoice): RedirectResponse
    {
        abort_unless(auth()->user()?->is_superadmin, 403);
        abort_unless($invoice->organization_id === $organization->id, 404);

        $data = $request->validate([
            'method' => ['required', 'string', 'in:cash,bank_transfer,other'],
            'reference' => ['nullable', 'string', 'max:120'],
        ]);

        $this->billing->settle($invoice, $data['method'], $data['reference'] ?? null);

        $name = $organization->name;

        return back()->with('success', "Payment recorded. {$name}'s subscription is settled.");
    }

    public function update(TenantSubscriptionUpdateRequest $request, Organization $organization): RedirectResponse
    {
        $validated = $request->validated();

        $subscription = Subscription::query()->updateOrCreate(
            ['organization_id' => $organization->id],
            [
                'subscription_plan_id' => $validated['subscription_plan_id'],
                'status' => $validated['status'],
                'billing_cycle' => $validated['billing_cycle'],
                'trial_ends_at' => $validated['trial_ends_at'] ?? null,
                'current_period_starts_at' => now(),
                'current_period_ends_at' => $validated['current_period_ends_at'] ?? null,
                'cancelled_at' => $validated['status'] === 'cancelled' ? now() : null,
            ],
        );

        $organization->update([
            'status' => match ($validated['status']) {
                'trial' => 'trial',
                'active', 'grace_period' => 'active',
                'suspended', 'expired', 'cancelled' => 'suspended',
            },
        ]);

        $this->recordEvent($organization, $subscription, 'subscription.updated', [
            'status' => $validated['status'],
            'billing_cycle' => $validated['billing_cycle'],
            'subscription_plan_id' => $validated['subscription_plan_id'],
        ]);

        return back()->with('success', 'CourtPrime tenant subscription updated.');
    }

    public function invoice(SubscriptionInvoiceStoreRequest $request, Organization $organization): RedirectResponse
    {
        $subscription = $organization->subscription()->with('plan')->firstOrFail();
        $validated = $request->validated();
        $subtotal = (float) ($validated['subtotal'] ?? $this->cycleAmount($subscription));
        $taxAmount = (float) ($validated['tax_amount'] ?? 0);
        $discountAmount = (float) ($validated['discount_amount'] ?? 0);
        $total = max($subtotal + $taxAmount - $discountAmount, 0);

        SubscriptionInvoice::query()->create([
            'organization_id' => $organization->id,
            'subscription_id' => $subscription->id,
            'invoice_number' => $this->nextInvoiceNumber(),
            'period_starts_on' => $validated['period_starts_on'] ?? $subscription->current_period_starts_at?->toDateString(),
            'period_ends_on' => $validated['period_ends_on'] ?? $subscription->current_period_ends_at?->toDateString(),
            'issued_on' => $validated['issued_on'],
            'due_on' => $validated['due_on'] ?? null,
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'discount_amount' => $discountAmount,
            'total_amount' => $total,
            'amount_paid' => 0,
            'status' => 'issued',
            'notes' => $validated['notes'] ?? null,
        ]);

        $this->recordEvent($organization, $subscription, 'invoice.issued', [
            'amount' => $total,
            'billing_cycle' => $subscription->billing_cycle,
        ]);

        return back()->with('success', 'CourtPrime subscription invoice issued.');
    }

    public function payment(SubscriptionPaymentStoreRequest $request, Organization $organization): RedirectResponse
    {
        $subscription = $organization->subscription()->firstOrFail();
        $validated = $request->validated();
        $invoice = null;

        if (! empty($validated['subscription_invoice_id'])) {
            $invoice = SubscriptionInvoice::query()
                ->withoutGlobalScope('organization')
                ->where('organization_id', $organization->id)
                ->where('subscription_id', $subscription->id)
                ->findOrFail($validated['subscription_invoice_id']);
        }

        DB::transaction(function () use ($validated, $organization, $subscription, $invoice) {
            SubscriptionPayment::query()->create([
                'organization_id' => $organization->id,
                'subscription_id' => $subscription->id,
                'subscription_invoice_id' => $invoice?->id,
                'reference' => $this->nextPaymentReference(),
                'amount' => $validated['amount'],
                'method' => $validated['method'],
                'status' => 'received',
                'external_reference' => $validated['external_reference'] ?? null,
                'paid_at' => $validated['paid_at'] ?? now(),
                'notes' => $validated['notes'] ?? null,
            ]);

            if ($invoice) {
                $amountPaid = (float) $invoice->amount_paid + (float) $validated['amount'];
                $invoice->update([
                    'amount_paid' => $amountPaid,
                    'status' => $amountPaid >= (float) $invoice->total_amount ? 'paid' : 'partial',
                ]);
            }

            if (in_array($subscription->status, ['trial', 'grace_period', 'expired', 'suspended'], true)) {
                $subscription->update(['status' => 'active']);
                $organization->update(['status' => 'active']);
            }

            $this->recordEvent($organization, $subscription, 'payment.received', [
                'amount' => $validated['amount'],
                'method' => $validated['method'],
                'invoice_id' => $invoice?->id,
            ]);
        });

        return back()->with('success', 'CourtPrime subscription payment recorded.');
    }

    private function cycleAmount(Subscription $subscription): float
    {
        $plan = $subscription->plan;

        return (float) match ($subscription->billing_cycle) {
            'quarterly' => $plan?->quarterly_price ?? ((float) ($plan?->monthly_price ?? 0) * 3),
            'annual' => $plan?->annual_price ?? ((float) ($plan?->monthly_price ?? 0) * 12),
            default => $plan?->monthly_price ?? 0,
        };
    }

    private function nextInvoiceNumber(): string
    {
        return 'CP-INV-'.now()->format('Ymd').'-'.str_pad((string) (SubscriptionInvoice::query()->count() + 1), 6, '0', STR_PAD_LEFT);
    }

    private function nextPaymentReference(): string
    {
        return 'CP-SUB-PAY-'.now()->format('Ymd').'-'.str_pad((string) (SubscriptionPayment::query()->count() + 1), 6, '0', STR_PAD_LEFT);
    }

    private function recordEvent(Organization $organization, Subscription $subscription, string $eventType, array $payload = []): void
    {
        SubscriptionEvent::query()->create([
            'organization_id' => $organization->id,
            'subscription_id' => $subscription->id,
            'event_type' => $eventType,
            'actor_name' => auth()->user()?->name,
            'payload' => $payload,
            'occurred_at' => now(),
        ]);
    }
}
