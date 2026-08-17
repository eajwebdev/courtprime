<?php

namespace App\Http\Requests;

use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;

class ExpenseStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return app(TenantContext::class)->activeRole()?->canManageTenant() === true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'category' => ['required', 'string', 'in:utilities,rent,salary,equipment,maintenance,supplies,marketing,other'],
            'supplier' => ['nullable', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'string', 'in:cash,card,bank_transfer,check,wallet,other'],
            'expense_date' => ['required', 'date'],
            'receipt_reference' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:pending,approved,paid,rejected'],
            'notes' => ['nullable', 'string', 'max:3000'],
            'approved_by' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}
