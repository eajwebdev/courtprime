<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourtAvailabilityBlock extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'branch_id',
        'court_id',
        'block_date',
        'start_time',
        'end_time',
        'reason',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'block_date' => 'date',
        ];
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }
}
