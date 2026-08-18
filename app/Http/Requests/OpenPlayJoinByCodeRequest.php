<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OpenPlayJoinByCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:32'],
            'key' => ['required', 'string', 'max:32'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Enter the session ID the club gave you.',
            'key.required' => 'Enter the session key.',
        ];
    }
}
