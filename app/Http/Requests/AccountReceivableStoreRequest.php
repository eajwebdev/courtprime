<?php

namespace App\Http\Requests;

use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;

class AccountReceivableStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = app(TenantContext::class)->activeRole();

        return $role?->canManageTenant() === true || in_array($role?->value, ['cashier', 'front_desk'], true);
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'organization_player_id' => ['nullable', 'integer', 'exists:organization_players,id'],
            'reservation_id' => ['nullable', 'integer', 'exists:reservations,id'],
            'customer_name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:reservation,membership,tournament,coaching,pos,other'],
            'amount_due' => ['required', 'numeric', 'min:0.01'],
            'due_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
