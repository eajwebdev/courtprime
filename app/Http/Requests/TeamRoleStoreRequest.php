<?php

namespace App\Http\Requests;

use App\Enums\PlatformRole;
use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class TeamRoleStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return app(TenantContext::class)->activeRole()?->canManageTenant() === true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'name' => ['nullable', 'required_without:user_id', 'string', 'max:255'],
            'email' => ['nullable', 'required_without:user_id', 'email', 'max:255'],
            'organization_id' => ['nullable', 'integer', 'exists:organizations,id'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'role_key' => ['required', new Enum(PlatformRole::class)],
            'is_primary' => ['boolean'],
        ];
    }
}
