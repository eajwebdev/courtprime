<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpenPlayPlayer extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'open_play_session_id',
        'player_id',
        'status',
        'checked_in_at',
        'withdrawn_at',
    ];

    protected function casts(): array
    {
        return [
            'checked_in_at' => 'datetime',
            'withdrawn_at' => 'datetime',
        ];
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(OpenPlaySession::class, 'open_play_session_id');
    }
}
