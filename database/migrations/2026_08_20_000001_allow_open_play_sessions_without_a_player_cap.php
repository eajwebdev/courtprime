<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * "Leave empty for no limit" was not true.
 *
 * The board's setup screen offers an empty player cap and says it means no
 * limit, and the column was NOT NULL with a default of 32 — so clearing the
 * field sent null and the save failed on a constraint, which the person at the
 * tablet saw as the session refusing to save at all.
 *
 * Nothing reads this column to enforce anything; the tournament equivalent has
 * been nullable from the start. Making it nullable is what the screen has been
 * promising all along.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('open_play_sessions', function (Blueprint $table) {
            $table->unsignedInteger('max_players')->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        /* Sessions that took the offer have no cap to go back to, so they take
           the default rather than blocking the rollback on a null. */
        DB::table('open_play_sessions')->whereNull('max_players')->update(['max_players' => 32]);

        Schema::table('open_play_sessions', function (Blueprint $table) {
            $table->unsignedInteger('max_players')->default(32)->nullable(false)->change();
        });
    }
};
