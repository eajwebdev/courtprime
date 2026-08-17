<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Two optional player photos.
 *
 * `avatar_path` is the head-and-shoulders image used anywhere the player is
 * listed: nav, leaderboards, reservations, check-in.
 *
 * `action_photo_path` is a full-body shot used only where there is room for a
 * hero treatment, such as the public identity card and tournament profiles.
 * Both are nullable; the UI falls back to initials when they are absent.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('player_profiles', function (Blueprint $table) {
            $table->string('avatar_path')->nullable()->after('last_name');
            $table->string('action_photo_path')->nullable()->after('avatar_path');
        });
    }

    public function down(): void
    {
        Schema::table('player_profiles', function (Blueprint $table) {
            $table->dropColumn(['avatar_path', 'action_photo_path']);
        });
    }
};
