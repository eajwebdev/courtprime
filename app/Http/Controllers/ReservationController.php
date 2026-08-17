<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReservationStoreRequest;
use App\Models\Court;
use App\Models\Reservation;
use App\Services\ReservationService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ReservationController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Reservation::class);

        return Inertia::render('reservations', [
            'reservations' => Reservation::query()
                ->with(['branch', 'court', 'player'])
                ->latest()
                ->paginate(15),
            'courts' => Court::query()->with('branch')->orderBy('court_number')->get(),
        ]);
    }

    public function store(ReservationStoreRequest $request, ReservationService $reservations): RedirectResponse
    {
        $this->authorize('create', Reservation::class);

        $reservations->create($request->validated());

        return back()->with('success', 'Reservation created.');
    }
}
