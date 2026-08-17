<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Court extends Model
{
    use BelongsToOrganization;
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'branch_id',
        'name',
        'court_number',
        'court_type',
        'environment',
        'surface_type',
        'capacity',
        'standard_hourly_rate',
        'peak_hourly_rate',
        'off_peak_hourly_rate',
        'member_hourly_rate',
        'guest_hourly_rate',
        'amenities',
        'photo_path',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'amenities' => 'array',
            'standard_hourly_rate' => 'decimal:2',
            'peak_hourly_rate' => 'decimal:2',
            'off_peak_hourly_rate' => 'decimal:2',
            'member_hourly_rate' => 'decimal:2',
            'guest_hourly_rate' => 'decimal:2',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function matches(): HasMany
    {
        return $this->hasMany(ClubMatch::class);
    }
}
