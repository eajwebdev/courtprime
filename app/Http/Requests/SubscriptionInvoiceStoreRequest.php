<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubscriptionInvoiceStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->is_superadmin;
    }

    public function rules(): array
    {
        return [
            'period_starts_on' => ['nullable', 'date'],
            'period_ends_on' => ['nullable', 'date', 'after_or_equal:period_starts_on'],
            'issued_on' => ['required', 'date'],
            'due_on' => ['nullable', 'date', 'after_or_equal:issued_on'],
            'subtotal' => ['nullable', 'numeric', 'min:0'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
