<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClubMatch extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'branch_id',
        'court_id',
        'match_type',
        'format',
        'target_score',
        'win_by_two',
        'scoring_mode',
        'team_one_name',
        'team_two_name',
        'team_one_score',
        'team_two_score',
        'serving_team',
        'serving_number',
        'game_number',
        'status',
        'verification_status',
        'verified_by',
        'verified_at',
        'started_at',
        'ended_at',
        'notes',
        'scorekeeper_id',
        'winner_player_id',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'verified_at' => 'datetime',
            'win_by_two' => 'boolean',
            'serving_number' => 'integer',
        ];
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function scoreEvents(): HasMany
    {
        return $this->hasMany(ScoreEvent::class);
    }

    public function games(): HasMany
    {
        return $this->hasMany(MatchGame::class);
    }

    public function disputes(): HasMany
    {
        return $this->hasMany(MatchDispute::class);
    }
}
