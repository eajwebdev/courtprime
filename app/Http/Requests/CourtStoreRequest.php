<?php

namespace App\Http\Requests;

use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;

class CourtStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return app(TenantContext::class)->activeRole()?->canManageTenant() === true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'name' => ['required', 'string', 'max:255'],
            'court_number' => ['required', 'integer', 'min:1', 'max:999'],
            'court_type' => ['required', 'string', 'max:80'],
            'environment' => ['required', 'string', 'max:80'],
            'surface_type' => ['required', 'string', 'max:80'],
            'capacity' => ['required', 'integer', 'min:1', 'max:24'],
            'standard_hourly_rate' => ['required', 'numeric', 'min:0'],
            'peak_hourly_rate' => ['required', 'numeric', 'min:0'],
            'off_peak_hourly_rate' => ['required', 'numeric', 'min:0'],
            'member_hourly_rate' => ['required', 'numeric', 'min:0'],
            'guest_hourly_rate' => ['required', 'numeric', 'min:0'],
            'amenities' => ['nullable', 'string', 'max:1000'],
            'status' => ['required', 'string', 'max:50'],
        ];
    }
}
