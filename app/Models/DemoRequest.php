<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DemoRequest extends Model
{
    protected $fillable = [
        'reference',
        'business_name',
        'contact_person',
        'email',
        'mobile_number',
        'website',
        'facebook_page',
        'branches_count',
        'courts_count',
        'estimated_members',
        'estimated_monthly_reservations',
        'existing_software',
        'pain_points',
        'features_needed',
        'demo_preference',
        'preferred_date',
        'preferred_time',
        'notes',
        'status',
        'assigned_to',
        'converted_organization_id',
        'converted_at',
        'follow_up_at',
    ];

    protected function casts(): array
    {
        return [
            'features_needed' => 'array',
            'preferred_date' => 'date',
            'follow_up_at' => 'datetime',
            'converted_at' => 'datetime',
        ];
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function convertedOrganization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'converted_organization_id');
    }
}
