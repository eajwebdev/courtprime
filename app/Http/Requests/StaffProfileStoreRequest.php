<?php

namespace App\Http\Requests;

use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StaffProfileStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return app(TenantContext::class)->activeRole()?->canManageTenant() === true;
    }

    public function rules(): array
    {
        $organizationId = app(TenantContext::class)->currentOrganizationId();

        return [
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'employee_id' => ['required', 'string', 'max:80', Rule::unique('staff_profiles', 'employee_id')->where('organization_id', $organizationId)],
            'name' => ['required', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_mobile' => ['nullable', 'string', 'max:50'],
            'hire_date' => ['nullable', 'date'],
            'status' => ['required', 'string', 'in:active,on_leave,suspended,terminated'],
            'emergency_contact' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
