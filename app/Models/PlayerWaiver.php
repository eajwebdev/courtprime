<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerWaiver extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'organization_player_id',
        'player_profile_id',
        'waiver_template_id',
        'version',
        'signature_name',
        'guardian_name',
        'status',
        'accepted_at',
    ];

    protected function casts(): array
    {
        return [
            'accepted_at' => 'datetime',
        ];
    }

    public function organizationPlayer(): BelongsTo
    {
        return $this->belongsTo(OrganizationPlayer::class);
    }

    public function playerProfile(): BelongsTo
    {
        return $this->belongsTo(PlayerProfile::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(WaiverTemplate::class, 'waiver_template_id');
    }
}
