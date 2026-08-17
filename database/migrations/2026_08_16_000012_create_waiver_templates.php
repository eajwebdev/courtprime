<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waiver_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('version')->default('v1');
            $table->text('body');
            $table->boolean('required_before_booking')->default(false);
            $table->string('status')->default('active')->index();
            $table->timestamps();

            $table->unique(['organization_id', 'title', 'version'], 'waiver_template_version_unique');
        });

        Schema::table('player_waivers', function (Blueprint $table) {
            $table->foreignId('waiver_template_id')->nullable()->after('player_profile_id')->constrained('waiver_templates')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('player_waivers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('waiver_template_id');
        });

        Schema::dropIfExists('waiver_templates');
    }
};
