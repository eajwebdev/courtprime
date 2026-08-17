<?php

namespace App\Services;

use App\Models\Court;
use Carbon\CarbonImmutable;

class ReservationPricingService
{
    public function quote(Court $court, string $date, string $startTime, string $endTime, bool $memberRate = false): array
    {
        $start = CarbonImmutable::parse($date.' '.$startTime);
        $end = CarbonImmutable::parse($date.' '.$endTime);
        $hours = max($start->diffInMinutes($end) / 60, 0.5);

        $rate = $memberRate && (float) $court->member_hourly_rate > 0
            ? (float) $court->member_hourly_rate
            : (float) $court->standard_hourly_rate;

        if (! $memberRate && $start->hour >= 17 && (float) $court->peak_hourly_rate > 0) {
            $rate = (float) $court->peak_hourly_rate;
        }

        $subtotal = round($hours * $rate, 2);
        $tax = round($subtotal * ((float) $court->branch->tax_rate / 100), 2);

        return [
            'subtotal' => $subtotal,
            'tax_amount' => $tax,
            'amount_due' => $subtotal + $tax,
            'duration_minutes' => (int) $start->diffInMinutes($end),
        ];
    }
}
