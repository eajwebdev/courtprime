<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PlayerPrivacyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'show_connected_clubs' => ['required', 'boolean'],
            'show_match_history' => ['required', 'boolean'],
            'show_rating' => ['required', 'boolean'],
            'show_city' => ['required', 'boolean'],
            'show_achievements' => ['required', 'boolean'],
        ];
    }
}
