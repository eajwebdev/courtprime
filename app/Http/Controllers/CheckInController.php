<?php

namespace App\Http\Controllers;

use App\Events\CourtStatusChanged;
use App\Events\ReservationStatusChanged;
use App\Models\Reservation;
use App\Services\BranchClock;
use App\Services\ReservationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckInController extends Controller
{
    public function __construct(private readonly BranchClock $clock) {}

    public function index(): Response
    {
        $this->authorize('viewAny', Reservation::class);

        return Inertia::render('check-in', [
            'reservations' => Reservation::query()
                ->with(['branch', 'court', 'player'])
                ->whereDate('reservation_date', $this->clock->today()->toDateString())
                ->whereIn('booking_status', ['confirmed', 'checked_in', 'playing'])
                ->orderBy('start_time')
                ->get(),
        ]);
    }

    public function checkIn(Request $request, Reservation $reservation, ReservationService $service): RedirectResponse
    {
        $this->authorize('update', $reservation);

        $service->checkIn($reservation, $request->user()->id);
        event(new ReservationStatusChanged($reservation->refresh()));

        return back()->with('success', 'Reservation checked in.');
    }

    public function start(Reservation $reservation, ReservationService $service): RedirectResponse
    {
        $this->authorize('update', $reservation);

        $service->startPlaying($reservation);
        $reservation->refresh()->load('court');
        event(new ReservationStatusChanged($reservation));
        if ($reservation->court) {
            event(new CourtStatusChanged($reservation->court));
        }

        return back()->with('success', 'Reservation started.');
    }

    public function complete(Reservation $reservation, ReservationService $service): RedirectResponse
    {
        $this->authorize('update', $reservation);

        $service->complete($reservation);
        $reservation->refresh()->load('court');
        event(new ReservationStatusChanged($reservation));
        if ($reservation->court) {
            event(new CourtStatusChanged($reservation->court));
        }

        return back()->with('success', 'Reservation completed.');
    }
}
