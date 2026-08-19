<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Two more action shots, for three in total.
 *
 * A player had one action photo, which is enough for a static identity card and
 * not enough for a board that cycles. The club scoreboard rotates a player's
 * portrait every ten seconds while they are on court, so one photo means the
 * same frame for the length of a game.
 *
 * Three separate columns rather than a JSON array: each slot is addressed on its
 * own by the upload form ("position 1/2/3"), replaced on its own, and deleted on
 * its own. A JSON list would make every one of those a read-modify-write.
 *
 * `action_photo_path` stays the first slot, so every existing photo and every
 * existing consumer of `action_photo_url` keeps working untouched.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('player_profiles', function (Blueprint $table) {
            $table->string('action_photo_two_path')->nullable()->after('action_photo_path');
            $table->string('action_photo_three_path')->nullable()->after('action_photo_two_path');
        });
    }

    public function down(): void
    {
        Schema::table('player_profiles', function (Blueprint $table) {
            $table->dropColumn(['action_photo_two_path', 'action_photo_three_path']);
        });
    }
};
