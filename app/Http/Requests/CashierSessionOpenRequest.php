<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CashierSessionOpenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'opening_cash' => ['required', 'numeric', 'min:0'],
        ];
    }
}
