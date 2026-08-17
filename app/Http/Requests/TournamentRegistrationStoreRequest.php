<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TournamentRegistrationStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tournament_division_id' => ['required', 'integer', 'exists:tournament_divisions,id'],
            'player_name' => ['required', 'string', 'max:255'],
            'player_email' => ['required', 'email', 'max:255'],
            'player_mobile_number' => ['nullable', 'string', 'max:50'],
            'skill_level' => ['nullable', 'string', 'max:80'],
            'partner_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
