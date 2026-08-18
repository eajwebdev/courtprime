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
            /*
             * Either an existing member, picked from the board's search, or a
             * name for someone who has never played here. Picking the member
             * is what keeps their games on their own record instead of on a
             * duplicate created from a typed name.
             */
            'player_id' => ['nullable', 'integer'],
            'name' => ['required_without:player_id', 'nullable', 'string', 'min:2', 'max:120'],
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
