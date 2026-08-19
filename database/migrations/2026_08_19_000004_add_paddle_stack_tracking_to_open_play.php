<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What a paddle stack has to remember.
 *
 * The rotation emptied the court after every game and refilled it from the
 * whole pool, so nobody could stay on and nothing needed remembering beyond a
 * queue position. Real open play keeps players on when nobody is waiting and
 * rotates out only as many as there are people to replace them — which means
 * knowing, per player per session, how long they have been on, how many games
 * they have played back to back, and when they started waiting.
 *
 * It lives on `open_play_queue` because that table is already unique per
 * session per player: it is the player's record in this session, and the
 * position column was only ever part of what it needed to hold.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('open_play_queue', function (Blueprint $table) {
            /* When the current wait began. Reset each time they rotate out, so
               "waited longest" means longest since last playing, not longest
               since arriving. */
            $table->timestamp('queue_entered_at')->nullable()->after('position');
            $table->timestamp('court_entered_at')->nullable()->after('queue_entered_at');
            $table->timestamp('last_played_at')->nullable()->after('court_entered_at');
            $table->unsignedInteger('games_played')->default(0)->after('last_played_at');
            /* Games finished without leaving the court. Reset on rotate out. */
            $table->unsignedInteger('consecutive_games_played')->default(0)->after('games_played');
            /* Accumulated across every wait, for the board's "waiting 24m". */
            $table->unsignedInteger('total_waiting_seconds')->default(0)->after('consecutive_games_played');

            $table->index(['open_play_session_id', 'status', 'position'], 'open_play_queue_session_status_position');
        });

        Schema::table('open_play_sessions', function (Blueprint $table) {
            /*
             * After this many games back to back, a player is first in line to
             * rotate out whenever anyone is waiting. Null is unlimited, which
             * is the behaviour clubs that let a winning pair stay expect.
             */
            $table->unsignedTinyInteger('max_consecutive_games')->nullable()->after('win_by_two');
        });
    }

    public function down(): void
    {
        Schema::table('open_play_queue', function (Blueprint $table) {
            $table->dropIndex('open_play_queue_session_status_position');
            $table->dropColumn([
                'queue_entered_at',
                'court_entered_at',
                'last_played_at',
                'games_played',
                'consecutive_games_played',
                'total_waiting_seconds',
            ]);
        });

        Schema::table('open_play_sessions', function (Blueprint $table) {
            $table->dropColumn('max_consecutive_games');
        });
    }
};
