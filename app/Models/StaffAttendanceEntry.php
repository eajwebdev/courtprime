<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffAttendanceEntry extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'staff_profile_id',
        'branch_id',
        'attendance_date',
        'time_in',
        'time_out',
        'status',
        'device',
        'qr_code',
        'gps_latitude',
        'gps_longitude',
        'notes',
        'recorded_by',
    ];

    protected function casts(): array
    {
        return [
            'attendance_date' => 'date',
            'gps_latitude' => 'decimal:7',
            'gps_longitude' => 'decimal:7',
        ];
    }

    public function staffProfile(): BelongsTo
    {
        return $this->belongsTo(StaffProfile::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
