<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PlayerStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'mobile_number' => ['nullable', 'string', 'max:50'],
            'emergency_contact' => ['nullable', 'string', 'max:255'],
            'birthdate' => ['nullable', 'date'],
            'rating' => ['required', 'numeric', 'min:1', 'max:6'],
            'skill_level' => ['required', 'string', 'max:50'],
            'membership_status' => ['required', 'string', 'max:50'],
        ];
    }
}
