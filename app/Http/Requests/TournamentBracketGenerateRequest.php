<?php

namespace App\Http\Requests;

use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;

class TournamentBracketGenerateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = app(TenantContext::class)->activeRole();

        return $role?->canManageTenant() === true || $role?->value === 'tournament_director';
    }

    public function rules(): array
    {
        return [
            'tournament_division_id' => ['required', 'integer', 'exists:tournament_divisions,id'],
            'overwrite' => ['nullable', 'boolean'],
        ];
    }
}
