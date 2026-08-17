<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_timeline_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('subject_type');
            $table->unsignedBigInteger('subject_id');
            $table->string('related_type')->nullable();
            $table->unsignedBigInteger('related_id')->nullable();
            $table->string('event_type')->index();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('visibility')->default('team')->index();
            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at')->index();
            $table->timestamps();

            $table->index(['subject_type', 'subject_id', 'occurred_at'], 'activity_subject_index');
            $table->index(['related_type', 'related_id', 'occurred_at'], 'activity_related_index');
            $table->index(['organization_id', 'branch_id', 'occurred_at'], 'activity_tenant_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_timeline_events');
    }
};
