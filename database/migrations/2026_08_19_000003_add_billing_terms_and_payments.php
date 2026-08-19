<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Terms, grace and how an invoice was actually paid.
 *
 * `term_months` is what the club chose to commit to. The plan already prices a
 * month, a quarter and a year, so the discount is the difference between paying
 * for twelve months one at a time and paying the annual rate.
 *
 * `grace_days` is how long past the due date a club keeps working. It is on the
 * subscription rather than a constant because a club being carried through a
 * hard month is a commercial decision, not a code change.
 *
 * The payment columns are on the invoice because that is the thing being paid:
 * a QRPh reference from PayMongo belongs against the bill it settles.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->unsignedSmallInteger('term_months')->default(1)->after('billing_cycle');
            $table->unsignedSmallInteger('grace_days')->default(2)->after('term_months');
        });

        Schema::table('subscription_invoices', function (Blueprint $table) {
            /* Past this, the subscription lapses. Held per invoice so changing
               the policy never moves a bill that was already issued. */
            $table->date('grace_ends_on')->nullable()->after('due_on');
            $table->string('payment_method')->nullable()->after('status');
            $table->string('payment_reference')->nullable()->after('payment_method');
            $table->timestamp('paid_at')->nullable()->after('payment_reference');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn(['term_months', 'grace_days']);
        });

        Schema::table('subscription_invoices', function (Blueprint $table) {
            $table->dropColumn(['grace_ends_on', 'payment_method', 'payment_reference', 'paid_at']);
        });
    }
};
