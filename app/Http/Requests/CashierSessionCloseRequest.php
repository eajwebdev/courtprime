<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CashierSessionCloseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'closing_cash' => ['required', 'numeric', 'min:0'],
        ];
    }
}
