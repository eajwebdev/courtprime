<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('owner_name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('status')->default('trial')->index();
            $table->string('timezone')->default('Asia/Manila');
            $table->string('currency', 3)->default('PHP');
            $table->boolean('demo_mode')->default(false);
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code', 16);
            $table->string('address')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('email')->nullable();
            $table->string('manager_name')->nullable();
            $table->string('status')->default('active')->index();
            $table->string('timezone')->default('Asia/Manila');
            $table->string('currency', 3)->default('PHP');
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->json('operating_hours')->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'code']);
            $table->index(['organization_id', 'status']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('organization_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->after('organization_id')->constrained()->nullOnDelete();
            $table->string('role_key')->default('player')->after('password')->index();
            $table->boolean('is_superadmin')->default(false)->after('role_key')->index();
            $table->string('position')->nullable()->after('is_superadmin');
            $table->string('mobile_number')->nullable()->after('position');
        });

        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->decimal('monthly_price', 12, 2)->default(0);
            $table->decimal('quarterly_price', 12, 2)->nullable();
            $table->decimal('annual_price', 12, 2)->nullable();
            $table->unsignedInteger('branch_limit')->nullable();
            $table->unsignedInteger('court_limit')->nullable();
            $table->unsignedInteger('staff_limit')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('subscription_plan_features', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_plan_id')->constrained()->cascadeOnDelete();
            $table->string('feature_key');
            $table->string('label');
            $table->boolean('enabled')->default(true);
            $table->unsignedInteger('limit_value')->nullable();
            $table->timestamps();

            $table->unique(['subscription_plan_id', 'feature_key'], 'plan_features_plan_feature_unique');
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_plan_id')->constrained()->restrictOnDelete();
            $table->string('status')->default('trial')->index();
            $table->string('billing_cycle')->default('monthly');
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_starts_at')->nullable();
            $table->timestamp('current_period_ends_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });

        Schema::create('demo_requests', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->string('business_name');
            $table->string('contact_person');
            $table->string('email')->index();
            $table->string('mobile_number');
            $table->string('website')->nullable();
            $table->string('facebook_page')->nullable();
            $table->unsignedInteger('branches_count')->default(1);
            $table->unsignedInteger('courts_count')->default(1);
            $table->unsignedInteger('estimated_members')->nullable();
            $table->unsignedInteger('estimated_monthly_reservations')->nullable();
            $table->string('existing_software')->nullable();
            $table->text('pain_points')->nullable();
            $table->json('features_needed')->nullable();
            $table->string('demo_preference')->default('online_demo');
            $table->date('preferred_date')->nullable();
            $table->time('preferred_time')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('new')->index();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('follow_up_at')->nullable();
            $table->timestamps();
        });

        Schema::create('courts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('court_number');
            $table->string('court_type')->default('standard');
            $table->string('environment')->default('indoor');
            $table->string('surface_type')->default('acrylic');
            $table->unsignedInteger('capacity')->default(4);
            $table->decimal('standard_hourly_rate', 12, 2)->default(0);
            $table->decimal('peak_hourly_rate', 12, 2)->default(0);
            $table->decimal('off_peak_hourly_rate', 12, 2)->default(0);
            $table->decimal('member_hourly_rate', 12, 2)->default(0);
            $table->decimal('guest_hourly_rate', 12, 2)->default(0);
            $table->json('amenities')->nullable();
            $table->string('photo_path')->nullable();
            $table->string('status')->default('available')->index();
            $table->timestamps();

            $table->unique(['branch_id', 'court_number']);
            $table->index(['organization_id', 'branch_id', 'status']);
        });

        Schema::create('players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email')->nullable()->index();
            $table->string('mobile_number')->nullable();
            $table->decimal('rating', 4, 2)->default(2.50);
            $table->string('membership_status')->default('guest')->index();
            $table->decimal('wallet_balance', 12, 2)->default(0);
            $table->timestamps();

            $table->index(['organization_id', 'membership_status']);
        });

        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('court_id')->constrained()->cascadeOnDelete();
            $table->foreignId('player_id')->nullable()->constrained()->nullOnDelete();
            $table->string('reference')->unique();
            $table->date('reservation_date')->index();
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedInteger('duration_minutes');
            $table->unsignedInteger('players_count')->default(2);
            $table->string('reservation_type')->default('court_booking');
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('deposit_amount', 12, 2)->default(0);
            $table->decimal('amount_due', 12, 2)->default(0);
            $table->string('payment_status')->default('unpaid')->index();
            $table->string('booking_status')->default('confirmed')->index();
            $table->string('source')->default('admin');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'branch_id', 'reservation_date']);
            $table->index(['court_id', 'reservation_date', 'start_time', 'end_time']);
        });

        Schema::create('club_matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('court_id')->constrained()->cascadeOnDelete();
            $table->string('match_type')->default('doubles');
            $table->string('format')->default('first_to_11_win_by_2');
            $table->string('team_one_name');
            $table->string('team_two_name');
            $table->unsignedInteger('team_one_score')->default(0);
            $table->unsignedInteger('team_two_score')->default(0);
            $table->unsignedInteger('game_number')->default(1);
            $table->string('status')->default('live')->index();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('score_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('club_match_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event_type');
            $table->string('team')->nullable();
            $table->unsignedInteger('team_one_score');
            $table->unsignedInteger('team_two_score');
            $table->json('payload')->nullable();
            $table->timestamps();
        });

        Schema::create('product_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('sku')->nullable();
            $table->string('name');
            $table->decimal('price', 12, 2)->default(0);
            $table->decimal('cost', 12, 2)->default(0);
            $table->integer('stock_on_hand')->default(0);
            $table->integer('reorder_point')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('pos_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('reference')->unique();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->string('payment_method')->default('cash');
            $table->string('status')->default('paid')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('branch_id');
            $table->dropConstrainedForeignId('organization_id');
            $table->dropColumn(['role_key', 'is_superadmin', 'position', 'mobile_number']);
        });

        Schema::dropIfExists('pos_transactions');
        Schema::dropIfExists('products');
        Schema::dropIfExists('product_categories');
        Schema::dropIfExists('score_events');
        Schema::dropIfExists('club_matches');
        Schema::dropIfExists('reservations');
        Schema::dropIfExists('players');
        Schema::dropIfExists('courts');
        Schema::dropIfExists('demo_requests');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('subscription_plan_features');
        Schema::dropIfExists('subscription_plans');
        Schema::dropIfExists('branches');
        Schema::dropIfExists('organizations');
    }
};
