<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubscriptionPlanFeatureStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_superadmin === true;
    }

    public function rules(): array
    {
        return [
            'feature_key' => ['required', 'string', 'max:120'],
            'label' => ['required', 'string', 'max:255'],
            'enabled' => ['required', 'boolean'],
            'limit_value' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
