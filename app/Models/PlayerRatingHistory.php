<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerRatingHistory extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'player_id',
        'club_match_id',
        'old_rating',
        'new_rating',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'old_rating' => 'decimal:2',
            'new_rating' => 'decimal:2',
        ];
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }
}
