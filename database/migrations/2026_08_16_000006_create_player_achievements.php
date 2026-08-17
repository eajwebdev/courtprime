<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('player_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organization_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('tournament_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('badge_color')->default('pink');
            $table->string('visibility')->default('public')->index();
            $table->timestamp('earned_at')->nullable();
            $table->timestamps();

            $table->unique(['player_profile_id', 'code', 'organization_id'], 'player_achievement_unique_scope');
            $table->index(['player_profile_id', 'visibility', 'earned_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_achievements');
    }
};
