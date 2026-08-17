<?php

namespace App\Http\Controllers;

use App\Models\Court;
use App\Models\Player;
use App\Models\Reservation;
use App\Services\BranchClock;
use Inertia\Inertia;
use Inertia\Response;

class OperationsController extends Controller
{
    public function __construct(private readonly BranchClock $clock)
    {
    }

    public function __invoke(): Response
    {
        $this->authorize('viewAny', Reservation::class);
        $today = $this->clock->today()->toDateString();

        return Inertia::render('operations', [
            'metrics' => [
                'checkIns' => Reservation::query()->whereDate('reservation_date', $today)->whereNotNull('checked_in_at')->count(),
                'playing' => Reservation::query()->where('booking_status', 'playing')->count(),
                'upcoming' => Reservation::query()->whereDate('reservation_date', $today)->where('booking_status', 'confirmed')->count(),
                'availableCourts' => Court::query()->where('status', 'available')->count(),
                'activePlayers' => Player::query()->whereNotNull('last_played_at')->count(),
            ],
            'queue' => Reservation::query()
                ->with(['court', 'player', 'branch'])
                ->whereDate('reservation_date', $today)
                ->whereIn('booking_status', ['confirmed', 'checked_in', 'playing'])
                ->orderBy('start_time')
                ->get(),
            'courts' => Court::query()->with('branch')->orderBy('branch_id')->orderBy('court_number')->get(),
        ]);
    }
}
