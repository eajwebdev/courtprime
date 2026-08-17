<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceWorkOrder extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'branch_id',
        'court_id',
        'court_availability_block_id',
        'reported_by',
        'assigned_to',
        'reference',
        'title',
        'priority',
        'status',
        'scheduled_date',
        'start_time',
        'end_time',
        'estimated_cost',
        'actual_cost',
        'description',
        'resolution_notes',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_date' => 'date',
            'estimated_cost' => 'decimal:2',
            'actual_cost' => 'decimal:2',
            'completed_at' => 'datetime',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }

    public function block(): BelongsTo
    {
        return $this->belongsTo(CourtAvailabilityBlock::class, 'court_availability_block_id');
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
