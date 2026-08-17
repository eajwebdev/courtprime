<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('employee_id');
            $table->string('name');
            $table->string('position')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_mobile')->nullable();
            $table->date('hire_date')->nullable();
            $table->string('status')->default('active')->index();
            $table->string('emergency_contact')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'employee_id']);
            $table->index(['organization_id', 'branch_id', 'status']);
        });

        Schema::create('staff_attendance_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->date('attendance_date')->index();
            $table->time('time_in')->nullable();
            $table->time('time_out')->nullable();
            $table->string('status')->default('present')->index();
            $table->string('device')->nullable();
            $table->string('qr_code')->nullable();
            $table->decimal('gps_latitude', 10, 7)->nullable();
            $table->decimal('gps_longitude', 10, 7)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['organization_id', 'branch_id', 'attendance_date'], 'staff_attendance_branch_date_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_attendance_entries');
        Schema::dropIfExists('staff_profiles');
    }
};
