<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountReceivable extends Model
{
    use BelongsToOrganization;

    protected $table = 'accounts_receivable';

    protected $fillable = [
        'organization_id',
        'branch_id',
        'organization_player_id',
        'reservation_id',
        'reference',
        'customer_name',
        'category',
        'amount_due',
        'amount_paid',
        'balance',
        'due_date',
        'status',
        'notes',
        'created_by',
        'settled_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_due' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'balance' => 'decimal:2',
            'due_date' => 'date',
            'settled_at' => 'datetime',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function organizationPlayer(): BelongsTo
    {
        return $this->belongsTo(OrganizationPlayer::class);
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }
}
