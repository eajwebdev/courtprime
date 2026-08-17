<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReservationStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'court_id' => ['required', 'integer', 'exists:courts,id'],
            'player_name' => ['required', 'string', 'max:255'],
            'player_email' => ['nullable', 'email', 'max:255'],
            'player_mobile_number' => ['nullable', 'string', 'max:50'],
            'reservation_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'players_count' => ['required', 'integer', 'min:1', 'max:12'],
            'reservation_type' => ['nullable', 'string', 'max:100'],
            'payment_status' => ['nullable', 'string', 'max:50'],
            'booking_status' => ['nullable', 'string', 'max:50'],
            'source' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
