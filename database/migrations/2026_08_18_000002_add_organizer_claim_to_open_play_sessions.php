<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * First device through the gate runs the session.
 *
 * The key previously granted everyone identical access, so any player who knew
 * it could score, undo and complete rounds. The first entrant now claims the
 * session and holds the controls; everyone else after them gets a read-only
 * board.
 *
 * Entrants are anonymous, so the claim is held by an opaque token stored in
 * that visitor's server session rather than a user id.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('open_play_sessions', function (Blueprint $table) {
            /*
             * Anchored to session_code, not session_key: `session_key` is added
             * by the migration after this one, so anchoring there fails on a
             * fresh MySQL install. Column order is cosmetic either way.
             */
            $table->string('organizer_token', 64)->nullable()->after('session_code');
            $table->timestamp('organizer_claimed_at')->nullable()->after('organizer_token');
        });
    }

    public function down(): void
    {
        Schema::table('open_play_sessions', function (Blueprint $table) {
            $table->dropColumn(['organizer_token', 'organizer_claimed_at']);
        });
    }
};
