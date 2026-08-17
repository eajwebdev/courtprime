<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->string('emergency_contact')->nullable()->after('mobile_number');
            $table->date('birthdate')->nullable()->after('emergency_contact');
            $table->string('skill_level')->default('beginner')->after('rating')->index();
            $table->unsignedInteger('total_reservations')->default(0)->after('wallet_balance');
            $table->timestamp('last_played_at')->nullable()->after('total_reservations');
            $table->json('preferences')->nullable()->after('last_played_at');
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->timestamp('checked_in_at')->nullable()->after('source')->index();
            $table->timestamp('playing_started_at')->nullable()->after('checked_in_at');
            $table->timestamp('completed_at')->nullable()->after('playing_started_at');
            $table->timestamp('cancelled_at')->nullable()->after('completed_at');
            $table->foreignId('checked_in_by')->nullable()->after('cancelled_at')->constrained('users')->nullOnDelete();
        });

        Schema::create('reservation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reservation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action')->index();
            $table->text('message')->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'reservation_id']);
        });

        Schema::create('court_availability_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('court_id')->constrained()->cascadeOnDelete();
            $table->date('block_date')->index();
            $table->time('start_time');
            $table->time('end_time');
            $table->string('reason')->default('maintenance');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['court_id', 'block_date', 'start_time', 'end_time'], 'court_blocks_time_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('court_availability_blocks');
        Schema::dropIfExists('reservation_logs');

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('checked_in_by');
            $table->dropColumn(['checked_in_at', 'playing_started_at', 'completed_at', 'cancelled_at']);
        });

        Schema::table('players', function (Blueprint $table) {
            $table->dropColumn(['emergency_contact', 'birthdate', 'skill_level', 'total_reservations', 'last_played_at', 'preferences']);
        });
    }
};
