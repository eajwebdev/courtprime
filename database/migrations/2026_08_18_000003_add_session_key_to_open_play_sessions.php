<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A second credential for open play sessions.
 *
 * The code alone identifies a session — it appears on a screen at the club and
 * is easy to read off or guess in sequence. The key is the secret half: both
 * are needed to join a session or open its board, so a session is only
 * reachable by someone the club actually handed the pair to.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('open_play_sessions', function (Blueprint $table) {
            $table->string('session_key', 32)->nullable()->after('session_code');
        });
    }

    public function down(): void
    {
        Schema::table('open_play_sessions', function (Blueprint $table) {
            $table->dropColumn('session_key');
        });
    }
};
