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
        'organizer_last_seen_at',
        'current_round',
        'auto_rotate',
        'format',
        'max_consecutive_games',
        'target_score',
        'win_by_two',
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
            'organizer_last_seen_at' => 'datetime',
            'session_date' => 'date',
            'auto_rotate' => 'boolean',
            'win_by_two' => 'boolean',
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

    /**
     * Players a court takes in this session's format.
     *
     * The one place this is decided. It used to be worked out separately in
     * PaddleStackService, OpenPlayRotationService and twice in the frontend,
     * and the frontend copy on the staff page was wrong for singles.
     */
    public function capacity(): int
    {
        return $this->format === 'singles' ? 2 : 4;
    }
}
