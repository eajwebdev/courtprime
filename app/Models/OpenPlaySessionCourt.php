<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** The subset of branch courts the owner allocated to a session. */
class OpenPlaySessionCourt extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'open_play_session_id',
        'court_id',
    ];

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }
}
