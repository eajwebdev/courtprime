<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpenPlayQueueEntry extends Model
{
    use BelongsToOrganization;

    protected $table = 'open_play_queue';

    protected $fillable = [
        'organization_id',
        'open_play_session_id',
        'player_id',
        'position',
        'status',
        'assigned_court_id',
        'called_at',
        'queue_entered_at',
        'court_entered_at',
        'last_played_at',
        'games_played',
        'consecutive_games_played',
        'total_waiting_seconds',
    ];

    /**
     * Where a player stands in this session.
     *
     * `waiting` and `on_court` are the two that matter to the rotation;
     * `up_next` is a display state the board sets for the players it has
     * already decided will go on when the current game ends, and `left` takes
     * somebody out of the stack without deleting the record that they were
     * here — which is what the collection sheet is settled from.
     */
    public const WAITING = 'waiting';

    public const UP_NEXT = 'up_next';

    public const ON_COURT = 'on_court';

    public const LEFT = 'left';

    /** States that still count as somebody wanting a game. */
    public const ACTIVE_STATUSES = [self::WAITING, self::UP_NEXT, self::ON_COURT];

    protected function casts(): array
    {
        return [
            'called_at' => 'datetime',
            'queue_entered_at' => 'datetime',
            'court_entered_at' => 'datetime',
            'last_played_at' => 'datetime',
        ];
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class, 'assigned_court_id');
    }
}
