<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Venue galleries.
 *
 * `courts.photo_path` holds a single image per court, which cannot express a
 * gallery and is the wrong granularity for a directory listing: a player
 * browsing /find-courts wants to see the venue, not one court in isolation.
 *
 * Photos hang off the branch so a club can show its courts, facilities and
 * surroundings in a defined order.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branch_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('caption')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['branch_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_photos');
    }
};
