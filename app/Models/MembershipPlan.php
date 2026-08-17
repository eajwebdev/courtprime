<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MembershipPlan extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'name',
        'code',
        'duration_days',
        'price',
        'benefits',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'benefits' => 'array',
        ];
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(PlayerMembership::class);
    }
}
