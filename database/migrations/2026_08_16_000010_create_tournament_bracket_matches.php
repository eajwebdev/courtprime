<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tournament_bracket_matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tournament_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tournament_division_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('round_number')->default(1);
            $table->unsignedInteger('match_number')->default(1);
            $table->unsignedInteger('bracket_position')->default(1);
            $table->foreignId('team_one_registration_id')->nullable()->constrained('tournament_registrations')->nullOnDelete();
            $table->foreignId('team_two_registration_id')->nullable()->constrained('tournament_registrations')->nullOnDelete();
            $table->foreignId('winner_registration_id')->nullable()->constrained('tournament_registrations')->nullOnDelete();
            $table->foreignId('club_match_id')->nullable()->constrained('club_matches')->nullOnDelete();
            $table->foreignId('court_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('scheduled_at')->nullable();
            $table->string('status')->default('scheduled')->index();
            $table->string('score_summary')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['tournament_division_id', 'round_number', 'match_number'], 'tournament_bracket_round_match_unique');
            $table->index(['organization_id', 'tournament_id', 'tournament_division_id'], 'tournament_bracket_scope_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tournament_bracket_matches');
    }
};
