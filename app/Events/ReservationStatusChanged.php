<?php

namespace App\Events;

use App\Models\Reservation;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReservationStatusChanged implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(public Reservation $reservation) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('organization.'.$this->reservation->organization_id),
            new PrivateChannel('branch.'.$this->reservation->branch_id),
            new PrivateChannel('court.'.$this->reservation->court_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'reservation.status.changed';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->reservation->id,
            'reference' => $this->reservation->reference,
            'booking_status' => $this->reservation->booking_status,
            'payment_status' => $this->reservation->payment_status,
            'court_id' => $this->reservation->court_id,
        ];
    }
}
