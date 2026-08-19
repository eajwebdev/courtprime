<?php

namespace App\Services;

use App\Models\Court;
use App\Models\CourtAvailabilityBlock;
use App\Models\Reservation;
use App\Support\PublicPlayerName;
use Illuminate\Support\Collection;

/**
 * What a court's day looks like, and why.
 *
 * A taken slot used to come back as `available: false` and nothing else, so the
 * grid could only shade it. Shading answers "no" without answering anything a
 * player actually asks next: is that a game I could join, is it my own booking,
 * is the court shut, when does it free up. Every slot now carries the hold that
 * closed it, so the grid can name it.
 *
 * Names are cut to a first name and a last initial. The booking grid is public
 * — no account needed to look at it — and "Maria C. has court 2 at seven" is
 * what a club whiteboard has always said, while a full name plus a standing
 * weekly slot is a stranger knowing where somebody will be. Nothing else about
 * the booker is exposed: no email, no mobile, no notes, no amount.
 */
class CourtAvailabilityService
{
    /** The bookable day, in whole hours. */
    public const OPENS_AT = 6;

    public const CLOSES_AT = 23;

    /** Every booking is a whole number of hours, between one and this many. */
    public const MAX_HOURS = 4;

    /** Court states that still take bookings; the rest close the day. */
    private const BOOKABLE_STATUSES = ['available', 'reserved', 'occupied', 'open_play'];

    /** Bookings in these states no longer hold the court. */
    private const RELEASED_STATUSES = ['cancelled', 'no_show'];

    /**
     * A live check against the database for one span.
     *
     * Deliberately not served from the day map below: this is what
     * ReservationService calls inside the transaction that locks the court, so
     * it has to read the table at that moment rather than from anything
     * gathered earlier in the request.
     */
    public function isAvailable(Court $court, string $date, string $startTime, string $endTime, ?int $ignoreReservationId = null): bool
    {
        if (! in_array($court->status, self::BOOKABLE_STATUSES, true)) {
            return false;
        }

        $hasReservationConflict = Reservation::query()
            ->withoutGlobalScope('organization')
            ->where('court_id', $court->id)
            ->whereDate('reservation_date', $date)
            ->whereNotIn('booking_status', self::RELEASED_STATUSES)
            ->when($ignoreReservationId, fn ($query) => $query->whereKeyNot($ignoreReservationId))
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where('start_time', '<', $endTime)
                    ->where('end_time', '>', $startTime);
            })
            ->exists();

        if ($hasReservationConflict) {
            return false;
        }

        return ! CourtAvailabilityBlock::query()
            ->withoutGlobalScope('organization')
            ->where('court_id', $court->id)
            ->whereDate('block_date', $date)
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where('start_time', '<', $endTime)
                    ->where('end_time', '>', $startTime);
            })
            ->exists();
    }

    /**
     * One court's day.
     *
     * @param  array<int, int>  $viewerPlayerIds  Club-side player ids belonging to
     *                                            whoever is looking, so their own
     *                                            bookings come back marked.
     * @return array<int, array<string, mixed>>
     */
    public function slots(Court $court, string $date, array $viewerPlayerIds = []): array
    {
        return $this->slotsFor([$court], $date, $viewerPlayerIds)[$court->id] ?? [];
    }

    /**
     * Every court's day, in two queries.
     *
     * The per-slot version ran two existence checks for each half hour of each
     * court: thirty-four slots against six courts was over four hundred queries
     * to paint one screen, and the page got slower every time a club added a
     * court. The day is read once and cut up in memory instead.
     *
     * @param  iterable<int, Court>  $courts
     * @param  array<int, int>  $viewerPlayerIds
     * @return array<int, array<int, array<string, mixed>>> Keyed by court id.
     */
    public function slotsFor(iterable $courts, string $date, array $viewerPlayerIds = []): array
    {
        $courts = collect($courts);
        $courtIds = $courts->pluck('id')->all();

        if ($courtIds === []) {
            return [];
        }

        $reservations = Reservation::query()
            ->withoutGlobalScope('organization')
            ->with('player:id,name')
            ->whereIn('court_id', $courtIds)
            ->whereDate('reservation_date', $date)
            ->whereNotIn('booking_status', self::RELEASED_STATUSES)
            ->orderBy('start_time')
            ->get()
            ->groupBy('court_id');

        $blocks = CourtAvailabilityBlock::query()
            ->withoutGlobalScope('organization')
            ->whereIn('court_id', $courtIds)
            ->whereDate('block_date', $date)
            ->orderBy('start_time')
            ->get()
            ->groupBy('court_id');

        $days = [];

        foreach ($courts as $court) {
            $days[$court->id] = $this->day(
                $court,
                $reservations->get($court->id) ?? collect(),
                $blocks->get($court->id) ?? collect(),
                $viewerPlayerIds,
            );
        }

        return $days;
    }

    /**
     * @param  Collection<int, Reservation>  $reservations
     * @param  Collection<int, CourtAvailabilityBlock>  $blocks
     * @param  array<int, int>  $viewerPlayerIds
     * @return array<int, array<string, mixed>>
     */
    private function day(Court $court, Collection $reservations, Collection $blocks, array $viewerPlayerIds): array
    {
        /* A court out of service is shut for the day, whatever the diary says. */
        $closed = ! in_array($court->status, self::BOOKABLE_STATUSES, true)
            ? [
                'key' => 'court-'.$court->id,
                'kind' => 'closed',
                'title' => 'Court closed',
                'detail' => str($court->status)->replace('_', ' ')->headline()->toString(),
                'reference' => null,
                'starts_at' => null,
                'ends_at' => null,
                'is_yours' => false,
            ]
            : null;

        $holds = $reservations
            ->map(fn (Reservation $reservation) => $this->bookingHold($reservation, $viewerPlayerIds))
            ->concat($blocks->map(fn (CourtAvailabilityBlock $block) => $this->blockHold($block)))
            ->all();

        $slots = [];

        /*
         * Courts are sold by the hour, on the hour. Half hours were offered
         * before and nobody plays thirty minutes of pickleball: it doubled the
         * rows on the grid, fragmented the day into gaps too short to sell, and
         * turned "6 to 7" into a two-tap drag.
         */
        for ($hour = self::OPENS_AT; $hour < self::CLOSES_AT; $hour++) {
            $start = sprintf('%02d:00', $hour);
            $end = sprintf('%02d:00', $hour + 1);

            /* First hold wins: a slot can only be reported as one thing, and
               a booking is more use to a player than "blocked". */
            $hold = $closed ?? $this->holdOver($holds, $start, $end);

            $slots[] = [
                'start_time' => $start,
                'end_time' => $end,
                'available' => $hold === null,
                'status' => $hold['kind'] ?? 'open',
                'hold' => $hold,
            ];
        }

        return $slots;
    }

    /**
     * @param  array<int, array<string, mixed>>  $holds
     * @return array<string, mixed>|null
     */
    private function holdOver(array $holds, string $start, string $end): ?array
    {
        foreach ($holds as $hold) {
            if ($hold['starts_at'] < $end && $hold['ends_at'] > $start) {
                return $hold;
            }
        }

        return null;
    }

    /**
     * @param  array<int, int>  $viewerPlayerIds
     * @return array<string, mixed>
     */
    private function bookingHold(Reservation $reservation, array $viewerPlayerIds): array
    {
        $yours = $reservation->player_id !== null && in_array((int) $reservation->player_id, $viewerPlayerIds, true);
        $kind = $this->kindOf((string) $reservation->reservation_type);

        return [
            /* Stable across slots so the grid can merge the cells of one
               booking into a single block rather than matching on the label. */
            'key' => 'reservation-'.$reservation->id,
            'kind' => $kind,
            'title' => match (true) {
                $yours => 'Your booking',
                $kind !== 'booked' => $this->typeLabel((string) $reservation->reservation_type),
                default => PublicPlayerName::short($reservation->player?->name) ?? 'Reserved',
            },
            'detail' => $this->bookingDetail($reservation, $kind),
            /* The club's own reference, which is what the desk asks for. It
               identifies the slot, not the person. */
            'reference' => $reservation->reference,
            'starts_at' => $this->hhmm($reservation->start_time),
            'ends_at' => $this->hhmm($reservation->end_time),
            'is_yours' => $yours,
        ];
    }

    /** @return array<string, mixed> */
    private function blockHold(CourtAvailabilityBlock $block): array
    {
        return [
            'key' => 'block-'.$block->id,
            'kind' => 'blocked',
            'title' => str((string) ($block->reason ?: 'unavailable'))->replace('_', ' ')->headline()->toString(),
            'detail' => 'Court unavailable',
            'reference' => null,
            'starts_at' => $this->hhmm($block->start_time),
            'ends_at' => $this->hhmm($block->end_time),
            'is_yours' => false,
        ];
    }

    /**
     * What is happening, in the words a player would use.
     *
     * `players_count` is on the booking, and a group of four on a court that
     * seats four is the difference between "no point asking" and "worth asking
     * whether they need a fourth".
     */
    private function bookingDetail(Reservation $reservation, string $kind): ?string
    {
        $parts = [];

        if ($kind === 'open_play') {
            $parts[] = 'Drop-in session';
        }

        $players = (int) $reservation->players_count;

        if ($players > 0) {
            $parts[] = $players.' '.str('player')->plural($players)->toString();
        }

        $parts[] = match ($reservation->booking_status) {
            'playing' => 'On court now',
            'checked_in' => 'Checked in',
            'completed' => 'Finished',
            default => null,
        };

        $parts = array_values(array_filter($parts));

        return $parts === [] ? null : implode(' · ', $parts);
    }

    /** `reservation_type` is a free string, so anything unmapped is a booking. */
    private function kindOf(string $type): string
    {
        return match ($type) {
            'open_play' => 'open_play',
            'tournament' => 'tournament',
            'coaching', 'clinic' => 'coaching',
            'maintenance', 'blocked' => 'blocked',
            default => 'booked',
        };
    }

    private function typeLabel(string $type): string
    {
        return match ($type) {
            'open_play' => 'Open play',
            'tournament' => 'Tournament',
            'coaching' => 'Coaching',
            'clinic' => 'Clinic',
            default => str($type)->replace('_', ' ')->headline()->toString(),
        };
    }

    /** Times come back from the driver as `18:00:00`; the grid speaks `18:00`. */
    private function hhmm(mixed $time): string
    {
        return substr((string) $time, 0, 5);
    }
}
