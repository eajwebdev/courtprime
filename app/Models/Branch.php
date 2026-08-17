<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    use BelongsToOrganization;
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'name',
        'code',
        'address',
        'contact_number',
        'email',
        'manager_name',
        'status',
        'timezone',
        'currency',
        'tax_rate',
        'operating_hours',
    ];

    protected function casts(): array
    {
        return [
            'tax_rate' => 'decimal:2',
            'operating_hours' => 'array',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function courts(): HasMany
    {
        return $this->hasMany(Court::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }
}
