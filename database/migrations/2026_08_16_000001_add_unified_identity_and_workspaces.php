<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->string('courtprime_player_id', 24)->unique();
            $table->string('display_name');
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('email')->nullable()->index();
            $table->string('mobile_number')->nullable();
            $table->date('birthday')->nullable();
            $table->string('gender')->nullable();
            $table->string('home_city')->nullable();
            $table->string('preferred_playing_hand')->nullable();
            $table->string('preferred_match_type')->nullable();
            $table->string('skill_level')->default('beginner')->index();
            $table->decimal('global_rating', 4, 2)->default(2.50);
            $table->decimal('singles_rating', 4, 2)->nullable();
            $table->decimal('doubles_rating', 4, 2)->nullable();
            $table->unsignedInteger('global_match_count')->default(0);
            $table->unsignedInteger('wins')->default(0);
            $table->unsignedInteger('losses')->default(0);
            $table->unsignedInteger('tournaments_played')->default(0);
            $table->json('privacy_settings')->nullable();
            $table->string('verification_status')->default('unverified')->index();
            $table->string('status')->default('active')->index();
            $table->timestamps();
        });

        Schema::create('organization_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('player_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('legacy_player_id')->nullable()->constrained('players')->nullOnDelete();
            $table->string('local_player_number')->nullable();
            $table->string('organization_skill_level')->nullable()->index();
            $table->foreignId('home_branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->string('status')->default('active')->index();
            $table->timestamp('first_visit_at')->nullable();
            $table->timestamp('last_visit_at')->nullable();
            $table->json('tags')->nullable();
            $table->text('notes')->nullable();
            $table->json('preferences')->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'player_profile_id'], 'organization_player_profile_unique');
            $table->unique(['organization_id', 'local_player_number'], 'organization_local_player_number_unique');
            $table->index(['organization_id', 'status']);
        });

        Schema::create('organization_user_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('role_key')->index();
            $table->string('status')->default('active')->index();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'organization_id', 'branch_id', 'role_key'], 'organization_user_role_unique');
            $table->index(['organization_id', 'role_key', 'status']);
        });

        Schema::create('login_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('email')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->boolean('succeeded')->default(false)->index();
            $table->string('failure_reason')->nullable();
            $table->timestamp('occurred_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('login_audits');
        Schema::dropIfExists('organization_user_roles');
        Schema::dropIfExists('organization_players');
        Schema::dropIfExists('player_profiles');
    }
};
