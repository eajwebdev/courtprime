<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationPlayer extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'player_profile_id',
        'legacy_player_id',
        'local_player_number',
        'organization_skill_level',
        'home_branch_id',
        'status',
        'wallet_balance',
        'first_visit_at',
        'last_visit_at',
        'tags',
        'notes',
        'preferences',
    ];

    protected function casts(): array
    {
        return [
            'first_visit_at' => 'datetime',
            'last_visit_at' => 'datetime',
            'wallet_balance' => 'decimal:2',
            'tags' => 'array',
            'preferences' => 'array',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function playerProfile(): BelongsTo
    {
        return $this->belongsTo(PlayerProfile::class);
    }

    public function legacyPlayer(): BelongsTo
    {
        return $this->belongsTo(Player::class, 'legacy_player_id');
    }

    public function homeBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'home_branch_id');
    }
}
