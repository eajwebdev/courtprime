<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpenPlayCourtHold extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'open_play_session_id',
        'court_id',
        'token_hash',
        'holder_name',
        'claimed_at',
        'last_seen_at',
    ];

    protected function casts(): array
    {
        return [
            'claimed_at' => 'datetime',
            'last_seen_at' => 'datetime',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(OpenPlaySession::class, 'open_play_session_id');
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }
}
