<?php

namespace App\Services;

use App\Models\Court;
use App\Models\CourtAvailabilityBlock;
use App\Models\Reservation;

class CourtAvailabilityService
{
    public function isAvailable(Court $court, string $date, string $startTime, string $endTime, ?int $ignoreReservationId = null): bool
    {
        if (! in_array($court->status, ['available', 'reserved', 'occupied', 'open_play'], true)) {
            return false;
        }

        $hasReservationConflict = Reservation::query()
            ->withoutGlobalScope('organization')
            ->where('court_id', $court->id)
            ->whereDate('reservation_date', $date)
            ->whereNotIn('booking_status', ['cancelled', 'no_show'])
            ->when($ignoreReservationId, fn ($query) => $query->whereKeyNot($ignoreReservationId))
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where('start_time', '<', $endTime)
                    ->where('end_time', '>', $startTime);
            })
            ->exists();

        if ($hasReservationConflict) {
            return false;
        }

        return ! CourtAvailabilityBlock::query()
            ->withoutGlobalScope('organization')
            ->where('court_id', $court->id)
            ->whereDate('block_date', $date)
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where('start_time', '<', $endTime)
                    ->where('end_time', '>', $startTime);
            })
            ->exists();
    }

    public function slots(Court $court, string $date): array
    {
        $slots = [];

        for ($hour = 6; $hour < 23; $hour++) {
            foreach (['00', '30'] as $minute) {
                $start = sprintf('%02d:%s', $hour, $minute);
                $endHour = $minute === '30' ? $hour + 1 : $hour;
                $endMinute = $minute === '30' ? '00' : '30';
                $end = sprintf('%02d:%s', $endHour, $endMinute);

                $slots[] = [
                    'start_time' => $start,
                    'end_time' => $end,
                    'available' => $this->isAvailable($court, $date, $start, $end),
                ];
            }
        }

        return $slots;
    }
}
