<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('platform_audit_logs', function (Blueprint $table) {
            $table->string('auditable_type')->nullable()->after('organization_id');
            $table->unsignedBigInteger('auditable_id')->nullable()->after('auditable_type');
            $table->json('old_values')->nullable()->after('metadata');
            $table->json('new_values')->nullable()->after('old_values');
            $table->index(['auditable_type', 'auditable_id']);
        });
    }

    public function down(): void
    {
        Schema::table('platform_audit_logs', function (Blueprint $table) {
            $table->dropIndex(['auditable_type', 'auditable_id']);
            $table->dropColumn(['auditable_type', 'auditable_id', 'old_values', 'new_values']);
        });
    }
};
