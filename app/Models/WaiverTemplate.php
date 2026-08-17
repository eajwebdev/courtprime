<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WaiverTemplate extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'title',
        'version',
        'body',
        'required_before_booking',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'required_before_booking' => 'boolean',
        ];
    }

    public function acceptedWaivers(): HasMany
    {
        return $this->hasMany(PlayerWaiver::class);
    }
}
