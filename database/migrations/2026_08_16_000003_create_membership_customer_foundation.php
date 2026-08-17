<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code');
            $table->unsignedInteger('duration_days')->default(30);
            $table->decimal('price', 12, 2)->default(0);
            $table->json('benefits')->nullable();
            $table->string('status')->default('active')->index();
            $table->timestamps();

            $table->unique(['organization_id', 'code']);
        });

        Schema::create('player_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('membership_plan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organization_player_id')->constrained()->cascadeOnDelete();
            $table->foreignId('player_profile_id')->constrained()->cascadeOnDelete();
            $table->date('starts_on');
            $table->date('ends_on')->nullable();
            $table->string('status')->default('active')->index();
            $table->boolean('auto_renew')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'status', 'ends_on']);
        });

        Schema::create('player_waivers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organization_player_id')->constrained()->cascadeOnDelete();
            $table->foreignId('player_profile_id')->constrained()->cascadeOnDelete();
            $table->string('version')->default('v1');
            $table->string('signature_name');
            $table->string('guardian_name')->nullable();
            $table->string('status')->default('accepted')->index();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'player_profile_id', 'status'], 'player_waiver_status_index');
        });

        Schema::create('crm_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organization_player_id')->constrained()->cascadeOnDelete();
            $table->foreignId('player_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('note_type')->default('general')->index();
            $table->string('visibility')->default('team')->index();
            $table->text('body');
            $table->timestamp('follow_up_at')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'organization_player_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_notes');
        Schema::dropIfExists('player_waivers');
        Schema::dropIfExists('player_memberships');
        Schema::dropIfExists('membership_plans');
    }
};
