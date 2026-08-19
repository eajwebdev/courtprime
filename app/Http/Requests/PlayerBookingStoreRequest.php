<?php

namespace App\Http\Requests;

use App\Services\CourtAvailabilityService;
use App\Support\NetworkClock;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The three rules a player booking obeys, enforced where they cannot be
 * bypassed.
 *
 * The grid already refuses to offer a half hour, a same-day slot or a fifth
 * hour, but a form post is a form post: anyone can send one that the UI would
 * never produce. These live here so the rule is the server's, not the browser's.
 */
class PlayerBookingStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'court_id' => ['required', 'integer', 'exists:courts,id'],
            /* Never today. See NetworkClock::firstBookableDate. */
            'reservation_date' => ['required', 'date', 'after_or_equal:'.NetworkClock::firstBookableDate()],
            /* On the hour, both ends: courts are sold by the hour. */
            'start_time' => ['required', 'date_format:H:i', 'regex:/^\d{2}:00$/'],
            'end_time' => ['required', 'date_format:H:i', 'regex:/^\d{2}:00$/', 'after:start_time'],
            'players_count' => ['required', 'integer', 'min:1', 'max:12'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'reservation_date.after_or_equal' => 'Courts are booked a day ahead. The earliest you can take is tomorrow.',
            'start_time.regex' => 'Courts are booked by the hour, so start on the hour.',
            'end_time.regex' => 'Courts are booked by the hour, so finish on the hour.',
        ];
    }

    /**
     * Length is a rule about two fields at once, which no single-field rule can
     * express: one to four whole hours.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->hasAny(['start_time', 'end_time'])) {
                return;
            }

            $minutes = $this->minutesBetween(
                (string) $this->input('start_time'),
                (string) $this->input('end_time'),
            );

            if ($minutes % 60 !== 0) {
                $validator->errors()->add('end_time', 'Courts are booked in whole hours.');

                return;
            }

            $hours = intdiv($minutes, 60);

            if ($hours < 1) {
                $validator->errors()->add('end_time', 'The shortest booking is one hour.');
            }

            if ($hours > CourtAvailabilityService::MAX_HOURS) {
                $validator->errors()->add(
                    'end_time',
                    'The longest booking is '.CourtAvailabilityService::MAX_HOURS.' hours. Book the rest as a second slot.',
                );
            }
        });
    }

    private function minutesBetween(string $start, string $end): int
    {
        [$startHour, $startMinute] = array_map('intval', explode(':', $start) + [0, 0]);
        [$endHour, $endMinute] = array_map('intval', explode(':', $end) + [0, 0]);

        return ($endHour * 60 + $endMinute) - ($startHour * 60 + $startMinute);
    }
}
