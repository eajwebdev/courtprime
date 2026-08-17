<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('demo_requests', function (Blueprint $table) {
            $table->foreignId('converted_organization_id')->nullable()->after('assigned_to')->constrained('organizations')->nullOnDelete();
            $table->timestamp('converted_at')->nullable()->after('converted_organization_id');
        });
    }

    public function down(): void
    {
        Schema::table('demo_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('converted_organization_id');
            $table->dropColumn('converted_at');
        });
    }
};
