<?php

namespace App\Events;

use App\Models\Tournament;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TournamentBracketUpdated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(public Tournament $tournament, public int $matchCount)
    {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('organization.'.$this->tournament->organization_id),
            new PrivateChannel('tournament.'.$this->tournament->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'tournament.bracket.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->tournament->id,
            'name' => $this->tournament->name,
            'match_count' => $this->matchCount,
        ];
    }
}
