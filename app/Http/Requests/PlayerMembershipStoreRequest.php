<?php

namespace App\Http\Requests;

use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;

class PlayerMembershipStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = app(TenantContext::class)->activeRole();

        return $role?->canManageTenant() === true || in_array($role?->value, ['front_desk', 'cashier'], true);
    }

    public function rules(): array
    {
        return [
            'membership_plan_id' => ['required', 'integer', 'exists:membership_plans,id'],
            'organization_player_id' => ['required', 'integer', 'exists:organization_players,id'],
            'starts_on' => ['required', 'date'],
            'auto_renew' => ['required', 'boolean'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
