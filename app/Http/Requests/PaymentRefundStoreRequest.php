<?php

namespace App\Http\Requests;

use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;

class PaymentRefundStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = app(TenantContext::class)->activeRole();

        return $role?->canManageTenant() === true || $role?->value === 'cashier';
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reason' => ['required', 'string', 'max:500'],
        ];
    }
}
