<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reservation extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'branch_id',
        'court_id',
        'player_id',
        'reference',
        'reservation_date',
        'start_time',
        'end_time',
        'duration_minutes',
        'players_count',
        'reservation_type',
        'subtotal',
        'discount_amount',
        'tax_amount',
        'deposit_amount',
        'amount_due',
        'payment_status',
        'booking_status',
        'source',
            'notes',
            'checked_in_at',
            'playing_started_at',
            'completed_at',
            'cancelled_at',
            'reminder_sent_at',
            'checked_in_by',
    ];

    protected function casts(): array
    {
        return [
            'reservation_date' => 'date',
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'amount_due' => 'decimal:2',
            'checked_in_at' => 'datetime',
            'playing_started_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'reminder_sent_at' => 'datetime',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function logs()
    {
        return $this->hasMany(ReservationLog::class);
    }
}
