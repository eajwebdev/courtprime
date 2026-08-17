<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScoreEvent extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'club_match_id',
        'recorded_by',
        'event_type',
        'team',
        'team_one_score',
        'team_two_score',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }

    public function match(): BelongsTo
    {
        return $this->belongsTo(ClubMatch::class, 'club_match_id');
    }
}
