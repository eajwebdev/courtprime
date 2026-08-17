<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PlayerProfileUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function messages(): array
    {
        return [
            'avatar.image' => 'Your profile photo must be an image file.',
            'avatar.max' => 'Your profile photo must be smaller than 4MB.',
            'action_photo.image' => 'Your action shot must be an image file.',
            'action_photo.max' => 'Your action shot must be smaller than 4MB.',
        ];
    }

    public function rules(): array
    {
        return [
            'display_name' => ['required', 'string', 'max:255'],
            /* Both photos are optional. 4MB covers a modern phone camera
               without letting someone upload a RAW file. */
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'action_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'remove_avatar' => ['sometimes', 'boolean'],
            'remove_action_photo' => ['sometimes', 'boolean'],
            'first_name' => ['nullable', 'string', 'max:120'],
            'last_name' => ['nullable', 'string', 'max:120'],
            'mobile_number' => ['nullable', 'string', 'max:50'],
            'birthday' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'max:80'],
            'home_city' => ['nullable', 'string', 'max:120'],
            'preferred_playing_hand' => ['nullable', 'string', 'in:right,left,ambidextrous'],
            'preferred_match_type' => ['nullable', 'string', 'in:singles,doubles,mixed_doubles,open_play'],
            'skill_level' => ['required', 'string', 'max:80'],
            'show_connected_clubs' => ['required', 'boolean'],
            'show_match_history' => ['required', 'boolean'],
            'show_rating' => ['required', 'boolean'],
            'show_city' => ['required', 'boolean'],
            'show_achievements' => ['required', 'boolean'],
        ];
    }
}
