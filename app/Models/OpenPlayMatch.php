<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One generated open play match: which court, which round, which four players.
 *
 * `club_matches` remains the scoreboard and the record of truth for results;
 * this sits alongside it so the rotation knows who partnered whom.
 */
class OpenPlayMatch extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'open_play_session_id',
        'club_match_id',
        'court_id',
        'round',
        'status',
        'winner_team',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(OpenPlaySession::class, 'open_play_session_id');
    }

    public function clubMatch(): BelongsTo
    {
        return $this->belongsTo(ClubMatch::class, 'club_match_id');
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }

    public function participants(): HasMany
    {
        return $this->hasMany(OpenPlayMatchPlayer::class);
    }
}
