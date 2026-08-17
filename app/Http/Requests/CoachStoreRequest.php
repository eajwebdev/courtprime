<?php

namespace App\Http\Requests;

use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;

class CoachStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return app(TenantContext::class)->activeRole()?->canManageTenant() === true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'mobile_number' => ['nullable', 'string', 'max:50'],
            'specialties' => ['nullable', 'string', 'max:1000'],
            'hourly_rate' => ['required', 'numeric', 'min:0'],
            'bio' => ['nullable', 'string', 'max:3000'],
            'status' => ['required', 'string', 'in:active,inactive,on_leave'],
        ];
    }
}
