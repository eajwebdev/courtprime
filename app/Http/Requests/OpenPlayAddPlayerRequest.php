<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OpenPlayAddPlayerRequest extends FormRequest
{
    /** The session code is the authorisation; see PublicOpenPlayBoardController. */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'mobile_number' => ['nullable', 'string', 'max:32'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Enter a name so the rotation can call them.',
            'name.min' => 'Enter a full name.',
        ];
    }
}
