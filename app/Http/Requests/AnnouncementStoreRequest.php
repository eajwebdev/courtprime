<?php

namespace App\Http\Requests;

use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AnnouncementStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return app(TenantContext::class)->activeRole()?->canManageTenant() === true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:5000'],
            'audience' => ['required', 'string', Rule::in(['all_players', 'branch', 'members', 'tournament_participants', 'open_play_participants', 'staff'])],
            'status' => ['required', 'string', Rule::in(['draft', 'scheduled', 'published', 'archived'])],
            'scheduled_at' => ['nullable', 'date'],
        ];
    }
}
