<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlatformAuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'organization_id',
        'auditable_type',
        'auditable_id',
        'action',
        'route_name',
        'method',
        'path',
        'ip_address',
        'user_agent',
        'metadata',
        'old_values',
        'new_values',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'old_values' => 'array',
            'new_values' => 'array',
            'occurred_at' => 'datetime',
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
}
