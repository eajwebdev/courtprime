<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubscriptionPlanStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_superadmin === true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:80', 'unique:subscription_plans,code'],
            'description' => ['nullable', 'string', 'max:1000'],
            'monthly_price' => ['required', 'numeric', 'min:0'],
            'quarterly_price' => ['nullable', 'numeric', 'min:0'],
            'annual_price' => ['nullable', 'numeric', 'min:0'],
            'branch_limit' => ['nullable', 'integer', 'min:1'],
            'court_limit' => ['nullable', 'integer', 'min:1'],
            'staff_limit' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
