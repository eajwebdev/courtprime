<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * When the device holding a board was last seen.
 *
 * The board is now held by one device at a time. Without a heartbeat, a tablet
 * that runs out of battery would hold the session for ever and nobody could
 * take it over with the key. The board touches this on every poll, so a holder
 * that has gone quiet can be replaced.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('open_play_sessions', function (Blueprint $table) {
            $table->timestamp('organizer_last_seen_at')->nullable()->after('organizer_claimed_at');
        });
    }

    public function down(): void
    {
        Schema::table('open_play_sessions', function (Blueprint $table) {
            $table->dropColumn('organizer_last_seen_at');
        });
    }
};
