<?php

namespace App\Notifications;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReservationReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly Reservation $reservation) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $branch = $this->reservation->branch;
        $court = $this->reservation->court;

        return (new MailMessage)
            ->subject('CourtPrime reservation reminder')
            ->greeting('Your CourtPrime court is coming up')
            ->line(($court?->name ?? 'Your court').' at '.($branch?->name ?? 'CourtPrime').' is reserved for '.$this->reservation->reservation_date?->toFormattedDateString().' at '.substr((string) $this->reservation->start_time, 0, 5).'.')
            ->action('Open CourtPrime', url('/me'))
            ->line('See you on court.');
    }
}
