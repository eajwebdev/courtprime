<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerAchievement extends Model
{
    protected $fillable = [
        'player_profile_id',
        'organization_id',
        'tournament_id',
        'code',
        'title',
        'description',
        'badge_color',
        'visibility',
        'earned_at',
    ];

    protected function casts(): array
    {
        return [
            'earned_at' => 'datetime',
        ];
    }

    public function playerProfile(): BelongsTo
    {
        return $this->belongsTo(PlayerProfile::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function tournament(): BelongsTo
    {
        return $this->belongsTo(Tournament::class);
    }
}
