<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DemoRequestStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'business_name' => ['required', 'string', 'max:255'],
            'contact_person' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'mobile_number' => ['required', 'string', 'max:50'],
            'website' => ['nullable', 'string', 'max:255'],
            'facebook_page' => ['nullable', 'string', 'max:255'],
            'branches_count' => ['required', 'integer', 'min:1', 'max:500'],
            'courts_count' => ['required', 'integer', 'min:1', 'max:5000'],
            'estimated_members' => ['nullable', 'integer', 'min:0'],
            'estimated_monthly_reservations' => ['nullable', 'integer', 'min:0'],
            'existing_software' => ['nullable', 'string', 'max:255'],
            'pain_points' => ['nullable', 'string', 'max:5000'],
            'features_needed' => ['nullable', 'array'],
            'features_needed.*' => ['string', 'max:100'],
            'demo_preference' => ['required', 'string', 'max:100'],
            'preferred_date' => ['nullable', 'date'],
            'preferred_time' => ['nullable', 'date_format:H:i'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
