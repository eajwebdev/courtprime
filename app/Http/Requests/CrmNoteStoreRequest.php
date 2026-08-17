<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CrmNoteStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'note_type' => ['required', 'string', 'in:general,follow_up,risk,preference,support'],
            'visibility' => ['required', 'string', 'in:team,manager'],
            'body' => ['required', 'string', 'max:3000'],
            'follow_up_at' => ['nullable', 'date'],
        ];
    }
}
