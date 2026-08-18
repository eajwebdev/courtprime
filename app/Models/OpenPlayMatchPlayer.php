<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpenPlayMatchPlayer extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'open_play_match_id',
        'player_id',
        'team',
    ];

    public function match(): BelongsTo
    {
        return $this->belongsTo(OpenPlayMatch::class, 'open_play_match_id');
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }
}
