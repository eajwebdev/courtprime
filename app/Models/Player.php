<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Player extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'user_id',
        'name',
        'email',
        'mobile_number',
        'emergency_contact',
        'birthdate',
        'rating',
        'skill_level',
        'membership_status',
        'wallet_balance',
        'total_reservations',
        'last_played_at',
        'preferences',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'decimal:2',
            'wallet_balance' => 'decimal:2',
            'birthdate' => 'date',
            'last_played_at' => 'datetime',
            'preferences' => 'array',
        ];
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function organizationPlayer(): HasOne
    {
        return $this->hasOne(OrganizationPlayer::class, 'legacy_player_id');
    }
}
