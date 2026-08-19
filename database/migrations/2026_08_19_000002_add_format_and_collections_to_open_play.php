<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Singles, and money.
 *
 * `format` lets a session run one against one instead of two against two; the
 * rotation reads it to decide how many players a court takes.
 *
 * The rest is collection. Entry is charged per player, but only once they have
 * actually played: someone who checked in, waited, and went home before a court
 * came free owes nothing. Recording what was taken against the player rather
 * than against the session is what lets a club settle up one person at a time,
 * which is how cash actually arrives at a desk.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('open_play_sessions', function (Blueprint $table) {
            $table->string('format')->default('doubles')->after('auto_rotate');
        });

        Schema::table('open_play_players', function (Blueprint $table) {
            $table->decimal('amount_paid', 10, 2)->default(0)->after('status');
            $table->timestamp('paid_at')->nullable()->after('amount_paid');
        });
    }

    public function down(): void
    {
        Schema::table('open_play_sessions', function (Blueprint $table) {
            $table->dropColumn('format');
        });

        Schema::table('open_play_players', function (Blueprint $table) {
            $table->dropColumn(['amount_paid', 'paid_at']);
        });
    }
};
