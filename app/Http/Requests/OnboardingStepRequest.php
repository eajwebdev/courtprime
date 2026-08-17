<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OnboardingStepRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'step' => ['required', 'string', Rule::in([
                'organization_information',
                'branch_setup',
                'court_creation',
                'operating_hours',
                'pricing_tax',
                'reservation_rules',
                'staff_roles',
                'membership_plans',
                'pos_configuration',
                'payment_configuration',
                'notification_setup',
                'go_live',
            ])],
            'completed' => ['required', 'boolean'],
        ];
    }
}
