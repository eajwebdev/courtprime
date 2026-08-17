<?php

namespace App\Jobs;

use App\Models\CourtPrimeNotification;
use App\Models\Reservation;
use App\Models\User;
use App\Notifications\ReservationReminderNotification;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendReservationReminders implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        Reservation::query()
            ->withoutGlobalScope('organization')
            ->with(['branch', 'court', 'player'])
            ->whereNull('reminder_sent_at')
            ->whereIn('booking_status', ['confirmed'])
            ->whereDate('reservation_date', '>=', today()->subDay())
            ->whereDate('reservation_date', '<=', today()->addDay())
            ->orderBy('reservation_date')
            ->limit(500)
            ->get()
            ->each(fn (Reservation $reservation) => $this->sendIfDue($reservation));
    }

    private function sendIfDue(Reservation $reservation): void
    {
        $timezone = $reservation->branch?->timezone ?? config('app.timezone', 'UTC');
        $startsAt = CarbonImmutable::parse($reservation->reservation_date?->toDateString().' '.substr((string) $reservation->start_time, 0, 5), $timezone);
        $now = CarbonImmutable::now($timezone);

        if ($startsAt->isPast() || $startsAt->gt($now->addHours(2))) {
            return;
        }

        $user = $reservation->player?->user_id ? User::query()->find($reservation->player->user_id) : null;

        CourtPrimeNotification::query()->create([
            'organization_id' => $reservation->organization_id,
            'user_id' => $user?->id,
            'category' => 'reservation',
            'channel' => 'app',
            'title' => 'Reservation reminder',
            'body' => ($reservation->court?->name ?? 'Your court').' starts at '.substr((string) $reservation->start_time, 0, 5).'.',
            'data' => ['url' => '/me', 'reservation_id' => $reservation->id],
        ]);

        $user?->notify(new ReservationReminderNotification($reservation));
        $reservation->update(['reminder_sent_at' => now()]);
    }
}
