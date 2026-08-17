<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DemoLeadConvertRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_superadmin === true;
    }

    public function rules(): array
    {
        return [
            'subscription_plan_id' => ['required', 'integer', 'exists:subscription_plans,id'],
            'billing_cycle' => ['required', 'string', 'in:monthly,quarterly,annual,manual'],
            'trial_ends_at' => ['nullable', 'date'],
        ];
    }
}
