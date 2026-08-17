<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tournament extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'branch_id',
        'name',
        'slug',
        'starts_on',
        'ends_on',
        'registration_opens_at',
        'registration_closes_at',
        'format',
        'visibility',
        'max_players',
        'entry_fee',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'starts_on' => 'date',
            'ends_on' => 'date',
            'registration_opens_at' => 'datetime',
            'registration_closes_at' => 'datetime',
            'entry_fee' => 'decimal:2',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function divisions(): HasMany
    {
        return $this->hasMany(TournamentDivision::class);
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
