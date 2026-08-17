<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PlayerAchievementStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'code' => ['nullable', 'string', 'max:80'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'badge_color' => ['required', 'string', 'in:pink,blue,emerald,amber,slate'],
            'visibility' => ['required', 'string', 'in:public,organization'],
            'tournament_id' => ['nullable', 'integer', 'exists:tournaments,id'],
            'earned_at' => ['nullable', 'date'],
        ];
    }
}
