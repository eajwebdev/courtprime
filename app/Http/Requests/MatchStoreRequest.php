<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MatchStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'court_id' => ['required', 'integer', 'exists:courts,id'],
            'match_type' => ['required', 'string', 'max:50'],
            'team_one_name' => ['required', 'string', 'max:255'],
            'team_two_name' => ['required', 'string', 'max:255'],
            'target_score' => ['required', 'integer', 'in:11,15,21'],
            'win_by_two' => ['boolean'],
            'scoring_mode' => ['required', 'string', 'max:50'],
        ];
    }
}
