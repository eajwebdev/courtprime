<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlayerProfile extends Model
{
    protected $fillable = [
        'user_id',
        'courtprime_player_id',
        'display_name',
        'first_name',
        'last_name',
        'avatar_path',
        'action_photo_path',
        'email',
        'mobile_number',
        'birthday',
        'gender',
        'home_city',
        'preferred_playing_hand',
        'preferred_match_type',
        'skill_level',
        'global_rating',
        'singles_rating',
        'doubles_rating',
        'global_match_count',
        'wins',
        'losses',
        'tournaments_played',
        'privacy_settings',
        'qr_token_version',
        'qr_token_rotated_at',
        'verification_status',
        'status',
    ];

    /**
     * Public URL for the head-and-shoulders avatar, or null when unset.
     */
    public function getAvatarUrlAttribute(): ?string
    {
        return $this->avatar_path ? \Illuminate\Support\Facades\Storage::disk('public')->url($this->avatar_path) : null;
    }

    /**
     * Public URL for the full-body action photo, or null when unset.
     */
    public function getActionPhotoUrlAttribute(): ?string
    {
        return $this->action_photo_path ? \Illuminate\Support\Facades\Storage::disk('public')->url($this->action_photo_path) : null;
    }

    protected function casts(): array
    {
        return [
            'birthday' => 'date',
            'global_rating' => 'decimal:2',
            'singles_rating' => 'decimal:2',
            'doubles_rating' => 'decimal:2',
            'privacy_settings' => 'array',
            'qr_token_rotated_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function organizationPlayers(): HasMany
    {
        return $this->hasMany(OrganizationPlayer::class);
    }

    public function achievements(): HasMany
    {
        return $this->hasMany(PlayerAchievement::class);
    }
}
