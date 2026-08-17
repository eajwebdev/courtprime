<?php

namespace App\Events;

use App\Models\ClubMatch;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MatchScoreUpdated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(public ClubMatch $match)
    {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('organization.'.$this->match->organization_id),
            new PrivateChannel('match.'.$this->match->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'match.score.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->match->id,
            'team_one_score' => $this->match->team_one_score,
            'team_two_score' => $this->match->team_two_score,
            'status' => $this->match->status,
            'verification_status' => $this->match->verification_status,
            'serving_team' => $this->match->serving_team,
        ];
    }
}
