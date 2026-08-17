<?php

namespace App\Http\Requests;

use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;

class StockTransferStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return app(TenantContext::class)->activeRole()?->canManageTenant() === true
            || in_array(app(TenantContext::class)->activeRole()?->value, ['cashier', 'front_desk'], true);
    }

    public function rules(): array
    {
        return [
            'from_branch_id' => ['required', 'integer', 'exists:branches,id', 'different:to_branch_id'],
            'to_branch_id' => ['required', 'integer', 'exists:branches,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
        ];
    }
}
