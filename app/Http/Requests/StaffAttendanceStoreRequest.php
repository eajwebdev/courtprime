<?php

namespace App\Http\Requests;

use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;

class StaffAttendanceStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = app(TenantContext::class)->activeRole();

        return $role?->canManageTenant() === true || $role?->value === 'front_desk';
    }

    public function rules(): array
    {
        return [
            'staff_profile_id' => ['required', 'integer', 'exists:staff_profiles,id'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'attendance_date' => ['required', 'date'],
            'time_in' => ['nullable', 'date_format:H:i'],
            'time_out' => ['nullable', 'date_format:H:i', 'after:time_in'],
            'status' => ['required', 'string', 'in:present,late,absent,half_day,remote'],
            'device' => ['nullable', 'string', 'max:255'],
            'qr_code' => ['nullable', 'string', 'max:255'],
            'gps_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'gps_longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'notes' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
