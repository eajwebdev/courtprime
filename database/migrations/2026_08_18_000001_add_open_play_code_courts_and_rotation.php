<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Open play: join-by-code, owner-selected courts, and automatic rotation.
 *
 * Purely additive. The existing sessions, players and queue tables are left
 * exactly as they are — this adds the three things the new flow needs and that
 * nothing in the schema could express:
 *
 *  - a shareable session code, because players now join themselves;
 *  - the subset of courts the owner allocated to the session;
 *  - which four players were in a generated match, so the rotation can avoid
 *    repeating partners and opponents. `club_matches` only stores team *names*,
 *    so partner history was not recoverable from it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('open_play_sessions', function (Blueprint $table) {
            $table->string('session_code', 32)->nullable()->after('name');
            /* Rounds are what the rotation counts to decide who has waited. */
            $table->unsignedInteger('current_round')->default(0)->after('status');
            $table->boolean('auto_rotate')->default(true)->after('current_round');

            $table->unique(['organization_id', 'session_code'], 'open_play_session_code_unique');
        });

        Schema::create('open_play_session_courts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('open_play_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('court_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['open_play_session_id', 'court_id'], 'open_play_session_court_unique');
        });

        Schema::create('open_play_matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('open_play_session_id')->constrained()->cascadeOnDelete();
            /* Nullable so a round can be planned before the scoreboard exists. */
            $table->foreignId('club_match_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('court_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('round')->default(1);
            $table->string('status')->default('live')->index();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['open_play_session_id', 'round']);
            $table->index(['open_play_session_id', 'status']);
        });

        Schema::create('open_play_match_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('open_play_match_id')->constrained()->cascadeOnDelete();
            $table->foreignId('player_id')->constrained()->cascadeOnDelete();
            /* 'one' or 'two'. Partner = same match, same team. */
            $table->string('team', 8);
            $table->timestamps();

            $table->unique(['open_play_match_id', 'player_id'], 'open_play_match_player_unique');
            $table->index(['player_id', 'open_play_match_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('open_play_match_players');
        Schema::dropIfExists('open_play_matches');
        Schema::dropIfExists('open_play_session_courts');

        Schema::table('open_play_sessions', function (Blueprint $table) {
            $table->dropUnique('open_play_session_code_unique');
            $table->dropColumn(['session_code', 'current_round', 'auto_rotate']);
        });
    }
};
