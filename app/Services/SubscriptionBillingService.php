<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\Subscription;
use App\Models\SubscriptionEvent;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * The life of a club's subscription.
 *
 * Four states, and the dates that move between them:
 *
 *   trialing  fourteen days, everything unlocked, no card, no invoice
 *   active    paid up to `current_period_ends_at`
 *   past_due  the bill is out and the grace days are running
 *   lapsed    grace ran out
 *
 * Renewing does not just extend a date, it issues the next invoice at the same
 * time, because a period that ends with nothing to pay is how a club quietly
 * stops being billed.
 */
class SubscriptionBillingService
{
    /** Long enough to run a real week of open play and see the numbers land. */
    public const TRIAL_DAYS = 14;

    /**
     * Fallback grace, used only if BILLING_LOCK_GRACE_DAYS is unset. The real
     * value is config('services.billing.lock_grace_days'), read through
     * defaultGraceDays() below so a club that changes the env value sees it
     * apply without a deploy touching this class.
     */
    public const DEFAULT_GRACE_DAYS = 2;

    /**
     * Terms a club can commit to, and what each is priced from.
     *
     * The discount is not a separate field: the plan prices a quarter and a
     * year outright, so committing longer is cheaper per month by exactly the
     * difference the club set.
     *
     * @var array<int, array{months:int, label:string, column:string}>
     */
    public const TERMS = [
        ['months' => 1, 'label' => 'Monthly', 'column' => 'monthly_price'],
        ['months' => 3, 'label' => 'Quarterly', 'column' => 'quarterly_price'],
        ['months' => 12, 'label' => 'Annual', 'column' => 'annual_price'],
    ];

    /**
     * Put a club on a free trial.
     *
     * Partner clubs come on this way: fourteen days, every feature, nothing to
     * pay and no invoice raised. It is a real subscription row so the rest of
     * the app has something to read, just one that has never been billed.
     */
    public function startTrial(Organization $organization, SubscriptionPlan $plan, int $days = self::TRIAL_DAYS): Subscription
    {
        return DB::transaction(function () use ($organization, $plan, $days) {
            $now = CarbonImmutable::now();

            $subscription = Subscription::query()->updateOrCreate(
                ['organization_id' => $organization->id],
                [
                    'subscription_plan_id' => $plan->id,
                    'status' => 'trialing',
                    'billing_cycle' => 'monthly',
                    'term_months' => $this->defaultTermMonths(),
                    'grace_days' => $this->defaultGraceDays(),
                    'trial_ends_at' => $now->addDays($days),
                    'current_period_starts_at' => $now,
                    'current_period_ends_at' => $now->addDays($days),
                    'cancelled_at' => null,
                ],
            );

            $this->record($subscription, 'trial_started', ['days' => $days, 'plan' => $plan->code]);

            return $subscription;
        });
    }

    /**
     * Start a paid term, and bill for it.
     *
     * Used both for the first payment after a trial and for changing plan or
     * term later. The period runs from today, so a club upgrading mid-trial is
     * not charged for days it has not reached.
     */
    public function subscribe(Organization $organization, SubscriptionPlan $plan, int $termMonths = 1): SubscriptionInvoice
    {
        return DB::transaction(function () use ($organization, $plan, $termMonths) {
            $term = $this->term($termMonths);
            $now = CarbonImmutable::now();

            $subscription = Subscription::query()->updateOrCreate(
                ['organization_id' => $organization->id],
                [
                    'subscription_plan_id' => $plan->id,
                    'status' => 'past_due',
                    'billing_cycle' => $this->cycleFor($term['months']),
                    'term_months' => $term['months'],
                    'grace_days' => $this->defaultGraceDays(),
                    'current_period_starts_at' => $now,
                    'current_period_ends_at' => $now->addMonths($term['months']),
                    'cancelled_at' => null,
                ],
            );

            $this->record($subscription, 'subscribed', ['plan' => $plan->code, 'term_months' => $term['months']]);

            return $this->issueInvoice($subscription->fresh('plan'));
        });
    }

    /**
     * Issue the bill for the current period.
     *
     * Due immediately, then the grace days run. A club that pays on the day
     * never sees the difference; one that pays late keeps working while it
     * sorts the transfer out.
     */
    public function issueInvoice(Subscription $subscription): SubscriptionInvoice
    {
        $plan = $subscription->plan;
        $term = $this->term((int) $subscription->term_months);
        $amount = (float) ($plan?->{$term['column']} ?? 0);

        $issued = CarbonImmutable::now();
        $grace = (int) ($subscription->grace_days ?: $this->defaultGraceDays());

        $invoice = SubscriptionInvoice::query()->create([
            'organization_id' => $subscription->organization_id,
            'subscription_id' => $subscription->id,
            'invoice_number' => $this->nextInvoiceNumber(),
            'period_starts_on' => $subscription->current_period_starts_at?->toDateString(),
            'period_ends_on' => $subscription->current_period_ends_at?->toDateString(),
            'issued_on' => $issued->toDateString(),
            'due_on' => $issued->toDateString(),
            'grace_ends_on' => $issued->addDays($grace)->toDateString(),
            'subtotal' => $amount,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total_amount' => $amount,
            'amount_paid' => 0,
            'status' => 'issued',
        ]);

        $this->record($subscription, 'invoice_issued', [
            'invoice' => $invoice->invoice_number,
            'total' => $amount,
            'grace_ends_on' => $invoice->grace_ends_on?->toDateString(),
        ]);

        return $invoice;
    }

    /**
     * Money arrived.
     *
     * Settles the bill, puts the club back on active, and rolls the period on
     * from where the last one ended rather than from today, so paying two days
     * late does not quietly buy two days less.
     */
    public function settle(SubscriptionInvoice $invoice, string $method, ?string $reference = null): Subscription
    {
        return DB::transaction(function () use ($invoice, $method, $reference) {
            $invoice->update([
                'amount_paid' => $invoice->total_amount,
                'status' => 'paid',
                'payment_method' => $method,
                'payment_reference' => $reference,
                'paid_at' => now(),
            ]);

            $subscription = $invoice->subscription()->with('plan')->firstOrFail();
            $months = (int) ($subscription->term_months ?: 1);

            /* From the end of the period just paid for, not from today. */
            $starts = $subscription->current_period_ends_at
                ? CarbonImmutable::parse($subscription->current_period_ends_at)
                : CarbonImmutable::now();

            $alreadyRunning = $starts->isFuture();

            $subscription->update([
                'status' => 'active',
                'trial_ends_at' => null,
                'current_period_starts_at' => $alreadyRunning ? $subscription->current_period_starts_at : $starts,
                'current_period_ends_at' => $alreadyRunning ? $starts : $starts->addMonths($months),
            ]);

            $this->record($subscription, 'payment_received', [
                'invoice' => $invoice->invoice_number,
                'method' => $method,
                'reference' => $reference,
                'next_due' => $subscription->fresh()->current_period_ends_at?->toDateString(),
            ]);

            return $subscription->fresh('plan');
        });
    }

    /**
     * Roll a subscription whose period has ended into its next one.
     *
     * Called for a club that is paid up and has reached the end of its term:
     * the next period and the next invoice are created together, which is what
     * "auto create the next billing due date" means in practice.
     */
    public function renew(Subscription $subscription): SubscriptionInvoice
    {
        return DB::transaction(function () use ($subscription) {
            $months = (int) ($subscription->term_months ?: 1);
            $starts = CarbonImmutable::parse($subscription->current_period_ends_at ?? now());

            $subscription->update([
                'status' => 'past_due',
                'current_period_starts_at' => $starts,
                'current_period_ends_at' => $starts->addMonths($months),
            ]);

            $this->record($subscription, 'renewed', ['term_months' => $months]);

            return $this->issueInvoice($subscription->fresh('plan'));
        });
    }

    /** Grace has run out. The club keeps its data and loses its features. */
    public function lapse(Subscription $subscription): void
    {
        $subscription->update(['status' => 'lapsed']);
        $this->record($subscription, 'lapsed', []);
    }

    /** Trialing, or paid up, or inside the grace days. */
    public function hasAccess(?Subscription $subscription): bool
    {
        if (! $subscription) {
            return true;
        }

        if ($subscription->status === 'trialing') {
            return $subscription->trial_ends_at === null || $subscription->trial_ends_at->isFuture();
        }

        if ($subscription->status === 'active') {
            return true;
        }

        if ($subscription->status === 'past_due') {
            return $this->graceEndsOn($subscription)?->endOfDay()->isFuture() ?? true;
        }

        return false;
    }

    /** The last day an unpaid club still works. */
    public function graceEndsOn(Subscription $subscription): ?CarbonImmutable
    {
        $invoice = $subscription->invoices()
            ->whereIn('status', ['issued', 'overdue', 'partial'])
            ->orderByDesc('id')
            ->first();

        if ($invoice?->grace_ends_on) {
            return CarbonImmutable::parse($invoice->grace_ends_on);
        }

        return $subscription->current_period_ends_at
            ? CarbonImmutable::parse($subscription->current_period_ends_at)->addDays((int) ($subscription->grace_days ?: $this->defaultGraceDays()))
            : null;
    }

    /**
     * What each term costs, and what it saves against paying monthly.
     *
     * @return array<int, array<string, mixed>>
     */
    public function termOptions(SubscriptionPlan $plan): array
    {
        $monthly = (float) $plan->monthly_price;

        return collect(self::TERMS)
            ->map(function (array $term) use ($plan, $monthly) {
                $total = (float) ($plan->{$term['column']} ?? 0);
                $full = $monthly * $term['months'];
                $saving = max(0, $full - $total);

                return [
                    'months' => $term['months'],
                    'label' => $term['label'],
                    'total' => $total,
                    'per_month' => $term['months'] > 0 ? round($total / $term['months'], 2) : $total,
                    'saving' => round($saving, 2),
                    'saving_percent' => $full > 0 ? (int) round(($saving / $full) * 100) : 0,
                ];
            })
            ->all();
    }

    /** From BILLING_LOCK_GRACE_DAYS. Falls back to DEFAULT_GRACE_DAYS if unset. */
    public function defaultGraceDays(): int
    {
        return (int) config('services.billing.lock_grace_days', self::DEFAULT_GRACE_DAYS);
    }

    /** From BILLING_CYCLE_MONTHS. The term a new subscription starts on before a club picks one. */
    public function defaultTermMonths(): int
    {
        return (int) config('services.billing.cycle_months', 1);
    }

    /** From BILLING_NOTIFY_DAYS. How long before an invoice is due the reminder goes out. */
    public function notifyDaysBeforeDue(): int
    {
        return (int) config('services.billing.notify_days', 3);
    }

    /**
     * From BILLING_MIN_AMOUNT. PayMongo has its own floor on what a QRPh
     * source can be raised for; this catches a bill under it with a message
     * that says why, before the API call does with one that does not.
     */
    public function minPayableAmount(): float
    {
        return (float) config('services.billing.min_amount', 0);
    }

    /** @return array{months:int, label:string, column:string} */
    private function term(int $months): array
    {
        foreach (self::TERMS as $term) {
            if ($term['months'] === $months) {
                return $term;
            }
        }

        return self::TERMS[0];
    }

    private function cycleFor(int $months): string
    {
        return match ($months) {
            12 => 'annual',
            3 => 'quarterly',
            default => 'monthly',
        };
    }

    private function nextInvoiceNumber(): string
    {
        $sequence = SubscriptionInvoice::query()->count() + 1;

        return 'CP-SUB-'.now()->format('Y').'-'.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
    }

    /** @param array<string, mixed> $payload */
    private function record(Subscription $subscription, string $type, array $payload): void
    {
        SubscriptionEvent::query()->create([
            'organization_id' => $subscription->organization_id,
            'subscription_id' => $subscription->id,
            'event_type' => $type,
            'actor_name' => auth()->user()?->name ?? 'System',
            'payload' => $payload,
            'occurred_at' => now(),
        ]);
    }
}
