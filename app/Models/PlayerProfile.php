<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

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
        'action_photo_two_path',
        'action_photo_three_path',
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
        return $this->avatar_path ? Storage::disk('public')->url($this->avatar_path) : null;
    }

    /**
     * Public URL for the full-body action photo, or null when unset.
     */
    public function getActionPhotoUrlAttribute(): ?string
    {
        return $this->publicUrl($this->action_photo_path);
    }

    public function getActionPhotoTwoUrlAttribute(): ?string
    {
        return $this->publicUrl($this->action_photo_two_path);
    }

    public function getActionPhotoThreeUrlAttribute(): ?string
    {
        return $this->publicUrl($this->action_photo_three_path);
    }

    /**
     * Every portrait this player has uploaded, avatar first, gaps closed up.
     *
     * The club scoreboard cycles this while they are on court. An empty list is
     * the normal case and the caller falls back to the CourtPrime defaults, so
     * a player who never uploads anything still gets a portrait on the TV.
     *
     * @return array<int, string>
     */
    public function getPortraitUrlsAttribute(): array
    {
        return array_values(array_filter([
            $this->avatar_url,
            $this->action_photo_url,
            $this->action_photo_two_url,
            $this->action_photo_three_url,
        ]));
    }

    /** The three action slots, in order, keyed by the column behind each. */
    public const ACTION_PHOTO_COLUMNS = [
        'action_photo' => 'action_photo_path',
        'action_photo_two' => 'action_photo_two_path',
        'action_photo_three' => 'action_photo_three_path',
    ];

    private function publicUrl(?string $path): ?string
    {
        return $path ? Storage::disk('public')->url($path) : null;
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
