<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Who won.
 *
 * Players now settle the result themselves at the court, so the winning side
 * is recorded on the open play match rather than inferred from whatever the
 * scoreboard happened to hold when the court was released.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('open_play_matches', function (Blueprint $table) {
            $table->string('winner_team', 8)->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('open_play_matches', function (Blueprint $table) {
            $table->dropColumn('winner_team');
        });
    }
};
