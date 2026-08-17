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
    ];

    protected function casts(): array
    {
        return [
            'called_at' => 'datetime',
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
