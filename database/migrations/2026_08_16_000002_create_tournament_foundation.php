<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tournaments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->date('starts_on')->index();
            $table->date('ends_on')->nullable();
            $table->timestamp('registration_opens_at')->nullable();
            $table->timestamp('registration_closes_at')->nullable();
            $table->string('format')->default('round_robin');
            $table->string('visibility')->default('public')->index();
            $table->unsignedInteger('max_players')->nullable();
            $table->decimal('entry_fee', 12, 2)->default(0);
            $table->string('status')->default('draft')->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'slug']);
            $table->index(['organization_id', 'branch_id', 'starts_on']);
        });

        Schema::create('tournament_divisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tournament_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('skill_level')->nullable();
            $table->string('match_type')->default('doubles');
            $table->string('gender_policy')->default('open');
            $table->unsignedInteger('max_teams')->nullable();
            $table->string('status')->default('open')->index();
            $table->timestamps();

            $table->unique(['tournament_id', 'name']);
        });

        Schema::create('tournament_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tournament_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tournament_division_id')->constrained()->cascadeOnDelete();
            $table->foreignId('player_profile_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('organization_player_id')->nullable()->constrained()->nullOnDelete();
            $table->string('player_name');
            $table->string('partner_name')->nullable();
            $table->unsignedInteger('seed')->nullable();
            $table->string('payment_status')->default('unpaid')->index();
            $table->string('status')->default('registered')->index();
            $table->timestamp('registered_at')->nullable();
            $table->timestamps();

            $table->index(['tournament_id', 'tournament_division_id', 'status'], 'tournament_registration_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tournament_registrations');
        Schema::dropIfExists('tournament_divisions');
        Schema::dropIfExists('tournaments');
    }
};
