<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Court;
use App\Models\CourtAvailabilityBlock;
use App\Models\Reservation;
use App\Services\BranchClock;
use App\Services\CourtAvailabilityService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The day, as a board.
 *
 * Courts across, hours down, and every booking drawn as one block over the
 * hours it actually covers. The previous version placed a booking in its
 * starting hour only, so the second hour of a two-hour booking rendered as
 * "Blocked" — the board disagreed with the diary about a court somebody was
 * standing on.
 *
 * Everything the board needs is resolved here rather than inferred in the
 * browser: bookings, the blocks that close a court for maintenance, and the
 * courts that are out of service for the whole day.
 */
class SchedulerController extends Controller
{
    public function __construct(private readonly BranchClock $clock) {}

    public function index(Request $request, CourtAvailabilityService $availability): Response
    {
        $this->authorize('viewAny', Reservation::class);

        /* Club-local today. `today()` is UTC and opened this page on yesterday
           for the first eight hours of every Manila morning. */
        $date = $request->query('date', $this->clock->today()->toDateString());
        $branchId = $request->query('branch_id') ? (int) $request->query('branch_id') : null;

        $courts = Court::query()
            ->with('branch:id,name,code')
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->orderBy('branch_id')
            ->orderBy('court_number')
            ->get();

        return Inertia::render('scheduler', [
            'date' => $date,
            'branchId' => $branchId,
            'opensAt' => CourtAvailabilityService::OPENS_AT,
            'closesAt' => CourtAvailabilityService::CLOSES_AT,
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name', 'code']),
            'courts' => $courts->map(fn (Court $court) => [
                'id' => $court->id,
                'name' => $court->name,
                'court_number' => (int) $court->court_number,
                'status' => (string) $court->status,
                'standard_hourly_rate' => $court->standard_hourly_rate,
                'branch' => ['id' => $court->branch?->id, 'name' => $court->branch?->name, 'code' => $court->branch?->code],
            ])->values(),
            /*
             * Full detail, unlike the public booking grid: this is a staff
             * screen, so the whole name, the reference and what is owed are the
             * point of it.
             */
            'reservations' => Reservation::query()
                ->with(['player:id,name,mobile_number'])
                ->whereDate('reservation_date', $date)
                ->whereNotIn('booking_status', ['cancelled', 'no_show'])
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->orderBy('start_time')
                ->get()
                ->map(fn (Reservation $reservation) => [
                    'id' => $reservation->id,
                    'court_id' => (int) $reservation->court_id,
                    'reference' => $reservation->reference,
                    'start_time' => substr((string) $reservation->start_time, 0, 5),
                    'end_time' => substr((string) $reservation->end_time, 0, 5),
                    'player' => $reservation->player?->name,
                    'mobile_number' => $reservation->player?->mobile_number,
                    'players_count' => (int) $reservation->players_count,
                    'booking_status' => (string) $reservation->booking_status,
                    'payment_status' => (string) $reservation->payment_status,
                    'amount_due' => (float) $reservation->amount_due,
                    'reservation_type' => (string) $reservation->reservation_type,
                ])
                ->values(),
            /* Drawn differently from a booking: nobody is coming, the court is
               shut, and the desk needs to see which at a glance. */
            'blocks' => CourtAvailabilityBlock::query()
                ->whereDate('block_date', $date)
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->orderBy('start_time')
                ->get()
                ->map(fn (CourtAvailabilityBlock $block) => [
                    'id' => $block->id,
                    'court_id' => (int) $block->court_id,
                    'start_time' => substr((string) $block->start_time, 0, 5),
                    'end_time' => substr((string) $block->end_time, 0, 5),
                    'reason' => (string) ($block->reason ?: 'unavailable'),
                ])
                ->values(),
        ]);
    }
}
