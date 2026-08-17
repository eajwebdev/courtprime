<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TournamentRegistration extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'tournament_id',
        'tournament_division_id',
        'player_profile_id',
        'organization_player_id',
        'player_name',
        'partner_name',
        'seed',
        'payment_status',
        'status',
        'registered_at',
    ];

    protected function casts(): array
    {
        return [
            'registered_at' => 'datetime',
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

    public function playerProfile(): BelongsTo
    {
        return $this->belongsTo(PlayerProfile::class);
    }

    public function organizationPlayer(): BelongsTo
    {
        return $this->belongsTo(OrganizationPlayer::class);
    }

    public function bracketMatchesAsTeamOne(): HasMany
    {
        return $this->hasMany(TournamentBracketMatch::class, 'team_one_registration_id');
    }

    public function bracketMatchesAsTeamTwo(): HasMany
    {
        return $this->hasMany(TournamentBracketMatch::class, 'team_two_registration_id');
    }
}
