<?php

namespace App\Services;

use App\Models\Court;
use App\Models\Reservation;
use App\Models\ReservationLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReservationService
{
    public function __construct(
        private readonly CourtAvailabilityService $availability,
        private readonly ReservationPricingService $pricing,
        private readonly PlayerIdentityService $playerIdentity,
        private readonly BranchClock $clock,
        private readonly NotificationService $notifications,
    ) {}

    public function create(array $data, bool $crossOrganizationCourtLookup = false): Reservation
    {
        return DB::transaction(function () use ($data, $crossOrganizationCourtLookup) {
            $courtQuery = Court::query()->with('branch');

            if ($crossOrganizationCourtLookup) {
                $courtQuery->withoutGlobalScope('organization');
            }

            /*
             * Lock the court row for the duration of the transaction.
             *
             * The availability check is a plain SELECT, and under MySQL's default
             * REPEATABLE READ that takes no locks at all. Two players booking the
             * same slot at the same moment would both read it as free and both
             * insert, producing a double booking. Locking the court serialises
             * every booking attempt for that court, so the second request only
             * runs its availability check after the first has committed.
             */
            $court = $courtQuery->lockForUpdate()->findOrFail($data['court_id']);

            if (! $this->availability->isAvailable($court, $data['reservation_date'], $data['start_time'], $data['end_time'])) {
                throw ValidationException::withMessages([
                    'court_id' => 'That time was just taken. Pick another slot.',
                ]);
            }

            $player = null;
            if (! empty($data['player_name'])) {
                $player = $this->playerIdentity->findOrCreateLocalPlayer($court->organization_id, $data);
            }

            $quote = $this->pricing->quote(
                $court,
                $data['reservation_date'],
                $data['start_time'],
                $data['end_time'],
                (bool) ($data['member_rate'] ?? false),
            );

            $reservation = Reservation::query()->create([
                'organization_id' => $court->organization_id,
                'branch_id' => $court->branch_id,
                'court_id' => $court->id,
                'player_id' => $player?->id,
                'reference' => $this->reference($court),
                'reservation_date' => $data['reservation_date'],
                'start_time' => $data['start_time'],
                'end_time' => $data['end_time'],
                'duration_minutes' => $quote['duration_minutes'],
                'players_count' => $data['players_count'] ?? 2,
                'reservation_type' => $data['reservation_type'] ?? 'court_booking',
                'subtotal' => $quote['subtotal'],
                'tax_amount' => $quote['tax_amount'],
                'amount_due' => $quote['amount_due'],
                'deposit_amount' => $data['deposit_amount'] ?? 0,
                'payment_status' => $data['payment_status'] ?? 'unpaid',
                'booking_status' => $data['booking_status'] ?? 'confirmed',
                'source' => $data['source'] ?? 'admin',
                'notes' => $data['notes'] ?? null,
            ]);

            $this->log($reservation, 'created', 'Reservation created through '.$reservation->source.'.');

            return $reservation;
        });
    }

    public function checkIn(Reservation $reservation, ?int $userId = null): Reservation
    {
        return DB::transaction(function () use ($reservation, $userId) {
            $reservation->update([
                'booking_status' => 'checked_in',
                'checked_in_at' => now(),
                'checked_in_by' => $userId,
            ]);

            $reservation->player?->increment('total_reservations');
            $reservation->player?->update(['last_played_at' => now()]);
            $this->log($reservation, 'checked_in', 'Player checked in at front desk.', ['checked_in_by' => $userId]);

            return $reservation->refresh();
        });
    }

    public function startPlaying(Reservation $reservation): Reservation
    {
        return DB::transaction(function () use ($reservation) {
            $reservation->court->update(['status' => 'occupied']);
            $reservation->update([
                'booking_status' => 'playing',
                'playing_started_at' => now(),
            ]);
            $this->log($reservation, 'playing_started', 'Court play started.');

            return $reservation->refresh();
        });
    }

    public function complete(Reservation $reservation): Reservation
    {
        return DB::transaction(function () use ($reservation) {
            $reservation->court->update(['status' => 'available']);
            $reservation->update([
                'booking_status' => 'completed',
                'completed_at' => now(),
            ]);
            $this->log($reservation, 'completed', 'Reservation completed.');

            return $reservation->refresh();
        });
    }

    public function cancel(Reservation $reservation, ?string $reason = null): Reservation
    {
        return DB::transaction(function () use ($reservation, $reason) {
            $reservation->update([
                'booking_status' => 'cancelled',
                'cancelled_at' => now(),
            ]);
            $this->log($reservation, 'cancelled', $reason ?: 'Reservation cancelled.');

            /* The court is sellable again, and somebody at the desk is the only
               one who can act on that. */
            $this->notifications->reservationCancelled($reservation, $reason);

            return $reservation->refresh();
        });
    }

    private function reference(Court $court): string
    {
        [$start, $end] = $this->clock->dayRange(branch: $court->branch);
        $localDate = $this->clock->today($court->branch);

        $count = Reservation::query()
            ->where('branch_id', $court->branch_id)
            ->whereBetween('created_at', [$start, $end])
            ->count() + 1;

        return sprintf('RSV-%s-%s-%04d', $court->branch->code, $localDate->format('Ymd'), $count);
    }

    private function log(Reservation $reservation, string $action, string $message, array $payload = []): void
    {
        ReservationLog::query()->create([
            'organization_id' => $reservation->organization_id,
            'reservation_id' => $reservation->id,
            'user_id' => auth()->id(),
            'action' => $action,
            'message' => $message,
            'payload' => $payload,
        ]);
    }
}
