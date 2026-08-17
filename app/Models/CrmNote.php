<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CrmNote extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'organization_player_id',
        'player_profile_id',
        'created_by',
        'note_type',
        'visibility',
        'body',
        'follow_up_at',
    ];

    protected function casts(): array
    {
        return [
            'follow_up_at' => 'datetime',
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

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
