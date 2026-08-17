<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MatchDisputeStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'in:score_correction,wrong_players,wrong_court,duplicate_match,other'],
            'description' => ['required', 'string', 'max:3000'],
        ];
    }
}
