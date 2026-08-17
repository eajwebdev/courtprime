<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TournamentDivision extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'tournament_id',
        'name',
        'skill_level',
        'match_type',
        'gender_policy',
        'max_teams',
        'status',
    ];

    public function tournament(): BelongsTo
    {
        return $this->belongsTo(Tournament::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(TournamentRegistration::class);
    }

    public function bracketMatches(): HasMany
    {
        return $this->hasMany(TournamentBracketMatch::class);
    }
}
