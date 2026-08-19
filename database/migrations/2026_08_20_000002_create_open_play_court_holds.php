<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One scorer per court, rather than one device per session.
 *
 * The board was held by a single device: the first person to enter the ID and
 * key ran everything, and a club with two courts going had one person walking
 * between them, or a second person locked out of the pair they were given. Two
 * courts means two games being scored at once by the two people standing at
 * them.
 *
 * The hold moves down a level. The session still has one host — whoever came
 * in first — who owns setup, and each court is claimed by at most one device,
 * so the number of people who can score at once is the number of courts and no
 * more. Two devices on the same court is still the thing being prevented: that
 * is how a game ends up with two versions of its score.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('open_play_court_holds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('open_play_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('court_id')->constrained()->cascadeOnDelete();
            /* Hashed, like the session's own token: the proof of the hold lives
               in the holder's server session and only its hash is stored here,
               so a row in this table cannot be replayed as a claim. */
            $table->string('token_hash');
            /* Only ever used to sign entries in the activity log, so "who
               scored that" has an answer. */
            $table->string('holder_name')->nullable();
            $table->timestamp('claimed_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            /* A court is scored by one device. This is the whole point. */
            $table->unique(['open_play_session_id', 'court_id'], 'open_play_court_hold_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('open_play_court_holds');
    }
};
