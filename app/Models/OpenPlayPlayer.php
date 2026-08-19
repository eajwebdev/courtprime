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
        'amount_paid',
        'paid_at',
        'checked_in_at',
        'withdrawn_at',
    ];

    protected function casts(): array
    {
        return [
            'checked_in_at' => 'datetime',
            'paid_at' => 'datetime',
            'amount_paid' => 'decimal:2',
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
