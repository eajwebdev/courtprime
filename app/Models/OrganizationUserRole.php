<?php

namespace App\Models;

use App\Enums\PlatformRole;
use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationUserRole extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'user_id',
        'organization_id',
        'branch_id',
        'role_key',
        'status',
        'is_primary',
    ];

    protected function casts(): array
    {
        return [
            'role_key' => PlatformRole::class,
            'is_primary' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
