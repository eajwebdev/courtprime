<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerRanking extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'player_id',
        'division',
        'rank',
        'rating',
        'wins',
        'losses',
        'points_for',
        'points_against',
        'ranked_at',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'decimal:2',
            'ranked_at' => 'datetime',
        ];
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }
}
