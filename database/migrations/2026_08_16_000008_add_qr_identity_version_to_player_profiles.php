<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('player_profiles', function (Blueprint $table) {
            $table->unsignedInteger('qr_token_version')->default(1)->after('privacy_settings');
            $table->timestamp('qr_token_rotated_at')->nullable()->after('qr_token_version');
        });
    }

    public function down(): void
    {
        Schema::table('player_profiles', function (Blueprint $table) {
            $table->dropColumn(['qr_token_version', 'qr_token_rotated_at']);
        });
    }
};
