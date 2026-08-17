<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Coach extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'branch_id',
        'user_id',
        'name',
        'email',
        'mobile_number',
        'specialties',
        'hourly_rate',
        'bio',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'specialties' => 'array',
            'hourly_rate' => 'decimal:2',
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
}
