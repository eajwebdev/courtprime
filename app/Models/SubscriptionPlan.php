<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'monthly_price',
        'quarterly_price',
        'annual_price',
        'branch_limit',
        'court_limit',
        'staff_limit',
        'is_active',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'monthly_price' => 'decimal:2',
            'quarterly_price' => 'decimal:2',
            'annual_price' => 'decimal:2',
            'is_active' => 'boolean',
            'metadata' => 'array',
        ];
    }

    public function features(): HasMany
    {
        return $this->hasMany(SubscriptionPlanFeature::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
