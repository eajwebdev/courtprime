<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReservationStoreRequest;
use App\Models\Branch;
use App\Models\Court;
use App\Models\Reservation;
use App\Services\BranchClock;
use App\Services\ReservationService;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReservationController extends Controller
{
    public function __construct(private readonly BranchClock $clock) {}

    /**
     * The booking calendar.
     *
     * A month at a glance, then one day in full. The page used to be a
     * paginated list of every reservation ever taken, newest first, which
     * answers no question anyone at a front desk actually asks: they want to
     * know what is on today, or what a given day looks like before they promise
     * a court to someone on the phone.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Reservation::class);

        /* Club-local today. `today()` is UTC and would show yesterday for the
           first eight hours of every Manila morning. */
        $date = $request->query('date', $this->clock->today()->toDateString());
        $cursor = CarbonImmutable::parse($date);
        $monthStart = $cursor->startOfMonth();
        $monthEnd = $cursor->endOfMonth();

        return Inertia::render('reservations', [
            'date' => $cursor->toDateString(),
            'month' => $monthStart->toDateString(),
            /* One row per day with anything on it, so the calendar can show
               load without shipping every reservation in the month. */
            'monthLoad' => Reservation::query()
                ->whereBetween('reservation_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->selectRaw('reservation_date, COUNT(*) as bookings, SUM(amount_due) as revenue')
                ->groupBy('reservation_date')
                ->get()
                ->mapWithKeys(fn ($row) => [
                    CarbonImmutable::parse($row->reservation_date)->toDateString() => [
                        'bookings' => (int) $row->bookings,
                        'revenue' => (float) $row->revenue,
                    ],
                ])
                ->all(),
            'reservations' => Reservation::query()
                ->with(['branch:id,name,code', 'court:id,name,branch_id', 'player:id,name,mobile_number'])
                ->whereDate('reservation_date', $cursor->toDateString())
                ->orderBy('start_time')
                ->get()
                ->map(fn (Reservation $reservation) => [
                    'id' => $reservation->id,
                    'reference' => $reservation->reference,
                    'start_time' => substr((string) $reservation->start_time, 0, 5),
                    'end_time' => substr((string) $reservation->end_time, 0, 5),
                    'players_count' => $reservation->players_count,
                    'amount_due' => $reservation->amount_due,
                    'booking_status' => $reservation->booking_status,
                    'payment_status' => $reservation->payment_status,
                    'source' => $reservation->source,
                    'notes' => $reservation->notes,
                    'court' => $reservation->court?->name,
                    'court_id' => $reservation->court_id,
                    'branch' => $reservation->branch?->name,
                    'player' => $reservation->player?->name,
                    'player_mobile' => $reservation->player?->mobile_number,
                ])
                ->all(),
            'courts' => Court::query()
                ->with('branch:id,name,code')
                ->orderBy('branch_id')
                ->orderBy('court_number')
                ->get(['id', 'name', 'branch_id', 'standard_hourly_rate']),
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(ReservationStoreRequest $request, ReservationService $reservations): RedirectResponse
    {
        $this->authorize('create', Reservation::class);

        $reservations->create($request->validated());

        return back()->with('success', 'Reservation created.');
    }
}
