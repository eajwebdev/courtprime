<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StaffProfile extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'branch_id',
        'user_id',
        'employee_id',
        'name',
        'position',
        'contact_email',
        'contact_mobile',
        'hire_date',
        'status',
        'emergency_contact',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'hire_date' => 'date',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function attendanceEntries(): HasMany
    {
        return $this->hasMany(StaffAttendanceEntry::class);
    }
}
