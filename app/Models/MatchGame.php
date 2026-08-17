<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MatchGame extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'club_match_id',
        'game_number',
        'team_one_score',
        'team_two_score',
        'winner_team',
        'started_at',
        'ended_at',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public function match(): BelongsTo
    {
        return $this->belongsTo(ClubMatch::class, 'club_match_id');
    }
}
