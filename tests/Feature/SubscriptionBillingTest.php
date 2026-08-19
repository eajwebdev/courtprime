<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\SubscriptionPlan;
use App\Services\Payments\PayMongoQrPh;
use App\Services\SubscriptionBillingService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The life of a club's subscription: trial, bill, grace, renew.
 */
class SubscriptionBillingTest extends TestCase
{
    use RefreshDatabase;

    private Organization $organization;

    private SubscriptionPlan $plan;

    private SubscriptionBillingService $billing;

    protected function setUp(): void
    {
        parent::setUp();

        $this->organization = Organization::query()->create([
            'name' => 'Billing Club',
            'slug' => 'billing-club',
            'owner_name' => 'Owner',
            'email' => 'ops@billing-club.test',
            'status' => 'active',
            'timezone' => 'Asia/Manila',
            'currency' => 'PHP',
        ]);

        /* Monthly 1000, quarterly 2700, annual 9600: a real discount for
           committing, which is what the term options have to surface. */
        $this->plan = SubscriptionPlan::query()->create([
            'name' => 'Professional',
            'code' => 'pro',
            'monthly_price' => 1000,
            'quarterly_price' => 2700,
            'annual_price' => 9600,
            'is_active' => true,
        ]);

        $this->billing = app(SubscriptionBillingService::class);
    }

    public function test_a_trial_runs_fourteen_days_and_raises_no_bill(): void
    {
        $subscription = $this->billing->startTrial($this->organization, $this->plan);

        $this->assertSame('trialing', $subscription->status);
        $this->assertSame(
            CarbonImmutable::now()->addDays(14)->toDateString(),
            CarbonImmutable::parse($subscription->trial_ends_at)->toDateString(),
        );
        $this->assertSame(0, $subscription->invoices()->count(), 'A free trial is not billed.');
        $this->assertTrue($this->billing->hasAccess($subscription), 'Everything is unlocked on trial.');
    }

    public function test_an_expired_trial_loses_access(): void
    {
        $subscription = $this->billing->startTrial($this->organization, $this->plan);
        $subscription->update(['trial_ends_at' => now()->subDay()]);

        $this->assertFalse($this->billing->hasAccess($subscription->fresh()));
    }

    public function test_subscribing_bills_the_chosen_term(): void
    {
        $invoice = $this->billing->subscribe($this->organization, $this->plan, 12);

        $this->assertEqualsWithDelta(9600, (float) $invoice->total_amount, 0.01, 'An annual term bills the annual price.');

        $subscription = $invoice->subscription;

        $this->assertSame(12, (int) $subscription->term_months);
        $this->assertSame('annual', $subscription->billing_cycle);
        $this->assertSame(
            CarbonImmutable::now()->addMonths(12)->toDateString(),
            CarbonImmutable::parse($subscription->current_period_ends_at)->toDateString(),
        );
    }

    public function test_an_unpaid_club_keeps_working_for_the_grace_days_then_stops(): void
    {
        $invoice = $this->billing->subscribe($this->organization, $this->plan, 1);
        $subscription = $invoice->subscription;

        $this->assertSame('past_due', $subscription->status);
        $this->assertTrue($this->billing->hasAccess($subscription), 'The grace days are still running.');

        $this->assertSame(
            CarbonImmutable::now()->addDays(2)->toDateString(),
            CarbonImmutable::parse($invoice->grace_ends_on)->toDateString(),
            'Two days to pay.',
        );

        /* Grace ran out. */
        $invoice->update(['grace_ends_on' => now()->subDay()->toDateString()]);

        $this->assertFalse($this->billing->hasAccess($subscription->fresh()));
    }

    public function test_paying_activates_the_club_and_sets_the_next_due_date(): void
    {
        $invoice = $this->billing->subscribe($this->organization, $this->plan, 1);
        $ends = CarbonImmutable::parse($invoice->subscription->current_period_ends_at);

        $subscription = $this->billing->settle($invoice, 'qrph', 'pm_test_123');

        $this->assertSame('active', $subscription->status);
        $this->assertTrue($this->billing->hasAccess($subscription));
        $this->assertSame($ends->toDateString(), CarbonImmutable::parse($subscription->current_period_ends_at)->toDateString());

        $invoice->refresh();

        $this->assertSame('paid', $invoice->status);
        $this->assertSame('pm_test_123', $invoice->payment_reference);
        $this->assertNotNull($invoice->paid_at);
    }

    public function test_paying_late_does_not_shorten_the_term(): void
    {
        $invoice = $this->billing->subscribe($this->organization, $this->plan, 1);
        $subscription = $invoice->subscription;

        $ends = CarbonImmutable::parse($subscription->current_period_ends_at);

        /* Settled two days after it fell due. The period paid for is the one
           that was billed, so the end date does not move. */
        CarbonImmutable::setTestNow(CarbonImmutable::now()->addDays(2));

        $renewed = $this->billing->settle($invoice->fresh(), 'qrph', 'pm_late');

        $this->assertSame($ends->toDateString(), CarbonImmutable::parse($renewed->current_period_ends_at)->toDateString());

        CarbonImmutable::setTestNow();
    }

    public function test_renewing_rolls_the_period_on_and_raises_the_next_bill(): void
    {
        $first = $this->billing->subscribe($this->organization, $this->plan, 1);
        $subscription = $this->billing->settle($first, 'qrph', 'pm_1');

        $previousEnd = CarbonImmutable::parse($subscription->current_period_ends_at);

        $next = $this->billing->renew($subscription->fresh());

        $this->assertSame($previousEnd->toDateString(), CarbonImmutable::parse($next->period_starts_on)->toDateString(), 'The next period starts where the last ended.');
        $this->assertSame($previousEnd->addMonth()->toDateString(), CarbonImmutable::parse($next->period_ends_on)->toDateString());
        $this->assertSame(2, $subscription->invoices()->count(), 'Renewing raises the next bill.');
    }

    public function test_term_options_show_what_committing_saves(): void
    {
        $options = collect($this->billing->termOptions($this->plan))->keyBy('months');

        $this->assertEqualsWithDelta(0, $options[1]['saving'], 0.01, 'Monthly is the baseline.');
        $this->assertEqualsWithDelta(300, $options[3]['saving'], 0.01, '3000 monthly against 2700 quarterly.');
        $this->assertEqualsWithDelta(2400, $options[12]['saving'], 0.01, '12000 monthly against 9600 annual.');
        $this->assertSame(20, $options[12]['saving_percent']);
        $this->assertEqualsWithDelta(800, $options[12]['per_month'], 0.01);
    }

    public function test_grace_days_reads_from_the_billing_config(): void
    {
        config(['services.billing.lock_grace_days' => 5]);

        $invoice = $this->billing->subscribe($this->organization, $this->plan, 1);

        $this->assertSame(
            CarbonImmutable::now()->addDays(5)->toDateString(),
            CarbonImmutable::parse($invoice->grace_ends_on)->toDateString(),
            'BILLING_LOCK_GRACE_DAYS should decide how long a bill can go unpaid before access is cut, not the class default.',
        );
    }

    public function test_a_new_subscription_defaults_to_the_configured_term(): void
    {
        config(['services.billing.cycle_months' => 3]);

        $subscription = $this->billing->startTrial($this->organization, $this->plan);

        $this->assertSame(3, (int) $subscription->term_months, 'BILLING_CYCLE_MONTHS is the term a subscription opens on before a club chooses one.');
    }

    public function test_paymongo_refuses_a_bill_under_the_configured_minimum(): void
    {
        config(['services.paymongo.secret' => 'sk_test_fake']);
        config(['services.billing.min_amount' => 6000]);

        $invoice = $this->billing->subscribe($this->organization, $this->plan, 1);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('below the minimum');

        app(PayMongoQrPh::class)->createPayment($invoice->fresh());
    }
}
