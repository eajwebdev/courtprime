<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OpenPlaySession extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'branch_id',
        'name',
        'session_code',
        'session_key',
        'organizer_token',
        'organizer_claimed_at',
        'current_round',
        'auto_rotate',
        'session_date',
        'start_time',
        'end_time',
        'max_players',
        'min_rating',
        'max_rating',
        'entry_fee',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'organizer_claimed_at' => 'datetime',
            'session_date' => 'date',
            'auto_rotate' => 'boolean',
            'min_rating' => 'decimal:2',
            'max_rating' => 'decimal:2',
            'entry_fee' => 'decimal:2',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function players(): HasMany
    {
        return $this->hasMany(OpenPlayPlayer::class);
    }

    public function queue(): HasMany
    {
        return $this->hasMany(OpenPlayQueueEntry::class);
    }

    /** Only the courts the owner allocated to this session. */
    public function sessionCourts(): HasMany
    {
        return $this->hasMany(OpenPlaySessionCourt::class);
    }

    public function courts(): BelongsToMany
    {
        return $this->belongsToMany(Court::class, 'open_play_session_courts')->withTimestamps();
    }

    public function matches(): HasMany
    {
        return $this->hasMany(OpenPlayMatch::class);
    }
}
