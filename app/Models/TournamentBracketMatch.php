<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TournamentBracketMatch extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'tournament_id',
        'tournament_division_id',
        'round_number',
        'match_number',
        'bracket_position',
        'team_one_registration_id',
        'team_two_registration_id',
        'winner_registration_id',
        'club_match_id',
        'court_id',
        'scheduled_at',
        'status',
        'score_summary',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function tournament(): BelongsTo
    {
        return $this->belongsTo(Tournament::class);
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(TournamentDivision::class, 'tournament_division_id');
    }

    public function teamOne(): BelongsTo
    {
        return $this->belongsTo(TournamentRegistration::class, 'team_one_registration_id');
    }

    public function teamTwo(): BelongsTo
    {
        return $this->belongsTo(TournamentRegistration::class, 'team_two_registration_id');
    }

    public function winner(): BelongsTo
    {
        return $this->belongsTo(TournamentRegistration::class, 'winner_registration_id');
    }

    public function clubMatch(): BelongsTo
    {
        return $this->belongsTo(ClubMatch::class);
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }
}
