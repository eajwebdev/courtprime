<?php

namespace App\Http\Requests;

use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;

class TournamentStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return app(TenantContext::class)->activeRole()?->canManageTenant() === true
            || app(TenantContext::class)->activeRole()?->value === 'tournament_director';
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'name' => ['required', 'string', 'max:255'],
            'starts_on' => ['required', 'date'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
            'registration_opens_at' => ['nullable', 'date'],
            'registration_closes_at' => ['nullable', 'date', 'after:registration_opens_at'],
            'format' => ['required', 'string', 'max:80'],
            'visibility' => ['required', 'string', 'in:public,private,invite_only'],
            'max_players' => ['nullable', 'integer', 'min:2', 'max:2048'],
            'entry_fee' => ['required', 'numeric', 'min:0'],
            'status' => ['required', 'string', 'in:draft,published,registration_open,live,completed,cancelled'],
            'division_name' => ['required', 'string', 'max:255'],
            'division_skill_level' => ['nullable', 'string', 'max:80'],
            'division_match_type' => ['required', 'string', 'max:80'],
            'division_gender_policy' => ['required', 'string', 'max:80'],
            'division_max_teams' => ['nullable', 'integer', 'min:2', 'max:512'],
            'notes' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
