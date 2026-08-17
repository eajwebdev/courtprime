<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Organization extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'owner_name',
        'email',
        'phone',
        'status',
        'timezone',
        'currency',
        'demo_mode',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'demo_mode' => 'boolean',
            'settings' => 'array',
        ];
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function courts(): HasMany
    {
        return $this->hasMany(Court::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function userRoles(): HasMany
    {
        return $this->hasMany(OrganizationUserRole::class);
    }

    public function organizationPlayers(): HasMany
    {
        return $this->hasMany(OrganizationPlayer::class);
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class)->latestOfMany();
    }
}
