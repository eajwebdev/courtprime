<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OpenPlaySessionStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    /**
     * The owner now only has to choose a branch, the courts and a name; the
     * code is generated when one is not supplied, and the rating window,
     * capacity and fee keep their previous defaults rather than being required
     * fields on a form the owner should be able to finish in seconds.
     */
    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'format' => ['nullable', 'in:singles,doubles'],
            'name' => ['required', 'string', 'max:255'],
            'session_code' => ['nullable', 'string', 'max:32', 'regex:/^[A-Za-z0-9-]+$/'],
            'court_ids' => ['required', 'array', 'min:1'],
            'court_ids.*' => ['integer', 'exists:courts,id'],
            'session_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'max_players' => ['nullable', 'integer', 'min:4', 'max:256'],
            'min_rating' => ['nullable', 'numeric', 'min:1', 'max:6'],
            'max_rating' => ['nullable', 'numeric', 'min:1', 'max:6'],
            'entry_fee' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'court_ids.required' => 'Choose at least one court for the session.',
            'session_code.regex' => 'Codes may only contain letters, numbers and dashes.',
        ];
    }
}
