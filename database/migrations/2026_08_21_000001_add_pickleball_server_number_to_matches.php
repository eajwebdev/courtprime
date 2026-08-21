<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('club_matches', function (Blueprint $table) {
            $table->unsignedTinyInteger('serving_number')->nullable()->default(2)->after('serving_team');
        });
    }

    public function down(): void
    {
        Schema::table('club_matches', function (Blueprint $table) {
            $table->dropColumn('serving_number');
        });
    }
};
