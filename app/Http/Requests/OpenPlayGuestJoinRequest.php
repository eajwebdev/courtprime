<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OpenPlayGuestJoinRequest extends FormRequest
{
    /** Deliberately public: walk-ins joining at the desk have no account yet. */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:32'],
            'key' => ['required', 'string', 'max:32'],
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'mobile_number' => ['nullable', 'string', 'max:32'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Enter the session ID the club gave you.',
            'key.required' => 'Enter the session key.',
            'name.required' => 'Enter your name so the club can call you to a court.',
            'name.min' => 'Enter your full name.',
        ];
    }
}
