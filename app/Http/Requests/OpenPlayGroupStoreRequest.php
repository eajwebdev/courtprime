<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OpenPlayGroupStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'mode' => ['required', 'string', Rule::in(['queue_priority', 'skill_based', 'random', 'winner_stays', 'manual'])],
            'group_size' => ['required', 'integer', 'min:2', 'max:6'],
            'court_id' => ['nullable', 'integer', 'exists:courts,id'],
            'player_ids' => ['nullable', 'array'],
            'player_ids.*' => ['integer', 'exists:players,id'],
        ];
    }
}
