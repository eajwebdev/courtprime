<?php

namespace App\Events;

use App\Models\Court;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CourtStatusChanged implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(public Court $court)
    {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('organization.'.$this->court->organization_id),
            new PrivateChannel('branch.'.$this->court->branch_id),
            new PrivateChannel('court.'.$this->court->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'court.status.changed';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->court->id,
            'branch_id' => $this->court->branch_id,
            'name' => $this->court->name,
            'status' => $this->court->status,
        ];
    }
}
