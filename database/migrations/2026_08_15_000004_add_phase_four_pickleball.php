<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('club_matches', function (Blueprint $table) {
            $table->foreignId('reservation_id')->nullable()->after('court_id')->constrained()->nullOnDelete();
            $table->string('serving_team')->default('team_one')->after('team_two_score');
            $table->unsignedInteger('target_score')->default(11)->after('format');
            $table->boolean('win_by_two')->default(true)->after('target_score');
            $table->string('scoring_mode')->default('side_out')->after('win_by_two');
            $table->foreignId('scorekeeper_id')->nullable()->after('notes')->constrained('users')->nullOnDelete();
            $table->foreignId('winner_player_id')->nullable()->after('scorekeeper_id')->constrained('players')->nullOnDelete();
        });

        Schema::create('match_games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('club_match_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('game_number');
            $table->unsignedInteger('team_one_score')->default(0);
            $table->unsignedInteger('team_two_score')->default(0);
            $table->string('winner_team')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->unique(['club_match_id', 'game_number']);
        });

        Schema::create('open_play_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->date('session_date')->index();
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedInteger('max_players')->default(32);
            $table->decimal('min_rating', 4, 2)->nullable();
            $table->decimal('max_rating', 4, 2)->nullable();
            $table->decimal('entry_fee', 12, 2)->default(0);
            $table->string('status')->default('scheduled')->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'branch_id', 'session_date']);
        });

        Schema::create('open_play_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('open_play_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('player_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('registered')->index();
            $table->timestamp('checked_in_at')->nullable();
            $table->timestamp('withdrawn_at')->nullable();
            $table->timestamps();

            $table->unique(['open_play_session_id', 'player_id'], 'open_play_player_unique');
        });

        Schema::create('open_play_queue', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('open_play_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('player_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('position');
            $table->string('status')->default('waiting')->index();
            $table->foreignId('assigned_court_id')->nullable()->constrained('courts')->nullOnDelete();
            $table->timestamp('called_at')->nullable();
            $table->timestamps();

            $table->unique(['open_play_session_id', 'player_id'], 'open_play_queue_player_unique');
            $table->index(['open_play_session_id', 'position']);
        });

        Schema::create('player_rankings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('player_id')->constrained()->cascadeOnDelete();
            $table->string('division')->default('club');
            $table->unsignedInteger('rank');
            $table->decimal('rating', 4, 2);
            $table->unsignedInteger('wins')->default(0);
            $table->unsignedInteger('losses')->default(0);
            $table->unsignedInteger('points_for')->default(0);
            $table->unsignedInteger('points_against')->default(0);
            $table->timestamp('ranked_at')->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'player_id', 'division'], 'player_ranking_unique');
            $table->index(['organization_id', 'division', 'rank']);
        });

        Schema::create('player_rating_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('player_id')->constrained()->cascadeOnDelete();
            $table->foreignId('club_match_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('old_rating', 4, 2);
            $table->decimal('new_rating', 4, 2);
            $table->string('reason')->default('match_result');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_rating_history');
        Schema::dropIfExists('player_rankings');
        Schema::dropIfExists('open_play_queue');
        Schema::dropIfExists('open_play_players');
        Schema::dropIfExists('open_play_sessions');
        Schema::dropIfExists('match_games');

        Schema::table('club_matches', function (Blueprint $table) {
            $table->dropConstrainedForeignId('winner_player_id');
            $table->dropConstrainedForeignId('scorekeeper_id');
            $table->dropColumn(['serving_team', 'target_score', 'win_by_two', 'scoring_mode']);
            $table->dropConstrainedForeignId('reservation_id');
        });
    }
};
