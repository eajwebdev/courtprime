<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Match settings the board can change.
 *
 * `club_matches` already carries `target_score` and `win_by_two` per match, but
 * the rotation created every match on the column defaults, so the people on the
 * court had no way to say "we are playing to 15 today". These two columns hold
 * the session's answer and the rotation stamps it onto each match it creates.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('open_play_sessions', function (Blueprint $table) {
            $table->unsignedSmallInteger('target_score')->default(11)->after('auto_rotate');
            $table->boolean('win_by_two')->default(true)->after('target_score');
        });
    }

    public function down(): void
    {
        Schema::table('open_play_sessions', function (Blueprint $table) {
            $table->dropColumn(['target_score', 'win_by_two']);
        });
    }
};
