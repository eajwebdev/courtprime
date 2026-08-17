<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerMembership extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'membership_plan_id',
        'organization_player_id',
        'player_profile_id',
        'starts_on',
        'ends_on',
        'status',
        'auto_renew',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'starts_on' => 'date',
            'ends_on' => 'date',
            'auto_renew' => 'boolean',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(MembershipPlan::class, 'membership_plan_id');
    }

    public function organizationPlayer(): BelongsTo
    {
        return $this->belongsTo(OrganizationPlayer::class);
    }

    public function playerProfile(): BelongsTo
    {
        return $this->belongsTo(PlayerProfile::class);
    }
}
