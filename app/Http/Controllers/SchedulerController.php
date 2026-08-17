<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Court;
use App\Models\Reservation;
use App\Services\CourtAvailabilityService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SchedulerController extends Controller
{
    public function index(Request $request, CourtAvailabilityService $availability): Response
    {
        $date = $request->query('date', today()->toDateString());
        $branchId = $request->query('branch_id');
        $courts = Court::query()
            ->with('branch')
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->orderBy('branch_id')
            ->orderBy('court_number')
            ->get();

        return Inertia::render('scheduler', [
            'date' => $date,
            'branchId' => $branchId ? (int) $branchId : null,
            'branches' => Branch::query()->orderBy('name')->get(),
            'courts' => $courts->map(fn (Court $court) => [
                ...$court->toArray(),
                'slots' => $availability->slots($court, $date),
            ]),
            'reservations' => Reservation::query()
                ->with(['court', 'player', 'branch'])
                ->whereDate('reservation_date', $date)
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->orderBy('start_time')
                ->get(),
        ]);
    }
}
