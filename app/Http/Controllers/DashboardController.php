<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\CashierSession;
use App\Models\ClubMatch;
use App\Models\Court;
use App\Models\DemoRequest;
use App\Models\OpenPlayPlayer;
use App\Models\OpenPlaySession;
use App\Models\Organization;
use App\Models\OrganizationPlayer;
use App\Models\Payment;
use App\Models\Player;
use App\Models\PlayerProfile;
use App\Models\PosTransaction;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\Subscription;
use App\Services\BranchClock;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private readonly BranchClock $clock)
    {
    }

    public function __invoke(Request $request, TenantContext $tenantContext): Response
    {
        $user = $request->user();
        $role = $tenantContext->activeRole();

        if ($user->is_superadmin) {
            return $this->superadminDashboard();
        }

        return match ($role?->value) {
            'cashier' => $this->cashierDashboard($user->id),
            'front_desk' => $this->frontDeskDashboard(),
            'scorekeeper', 'tournament_director' => $this->sportsDashboard($role->value),
            'player' => $this->playerDashboard($user->id),
            default => $this->ownerDashboard($role?->value ?? 'organization_owner'),
        };
    }

    private function superadminDashboard(): Response
    {
        return Inertia::render('dashboard', [
            'mode' => 'superadmin',
            'role' => 'eaj_superadmin',
            'title' => 'EAJ Platform Command Center',
            'subtitle' => 'Network growth, SaaS health, demos, and CourtPrime activity across all connected organizations.',
            'metrics' => [
                'organizations' => Organization::query()->count(),
                'activeSubscriptions' => Subscription::query()->where('status', 'active')->count(),
                'trialOrganizations' => Organization::query()->where('status', 'trial')->count(),
                'demoRequests' => DemoRequest::query()->where('status', 'new')->count(),
                'branches' => Branch::withoutGlobalScope('organization')->count(),
                'courts' => Court::withoutGlobalScope('organization')->count(),
                'globalPlayers' => PlayerProfile::query()->count(),
                'reservationsToday' => Reservation::withoutGlobalScope('organization')->whereDate('reservation_date', today())->count(),
                'mrr' => (float) Subscription::query()
                    ->where('subscriptions.status', 'active')
                    ->join('subscription_plans', 'subscription_plans.id', '=', 'subscriptions.subscription_plan_id')
                    ->sum('subscription_plans.monthly_price'),
            ],
            'chartData' => $this->chartData(global: true),
            'demoRequests' => DemoRequest::query()->latest()->limit(6)->get(),
        ]);
    }

    private function ownerDashboard(string $role): Response
    {
        $courtCount = Court::query()->count();
        $activeCourtCount = Court::query()->whereIn('status', ['occupied', 'reserved', 'open_play'])->count();
        $today = $this->clock->today()->toDateString();
        [$startOfDay, $endOfDay] = $this->clock->dayRange();

        return Inertia::render('dashboard', [
            'mode' => 'tenant',
            'role' => $role,
            'title' => 'Business Command Center',
            'subtitle' => 'Revenue, reservations, branch performance, live courts, and player activity for this CourtPrime workspace.',
            'organization' => auth()->user()?->organization,
            'branches' => Branch::query()->withCount('courts')->get(),
            'metrics' => [
                'revenueToday' => (float) Payment::query()->whereBetween('paid_at', [$startOfDay, $endOfDay])->sum('amount'),
                'reservationsToday' => Reservation::query()->whereDate('reservation_date', $today)->count(),
                'activeCourts' => $activeCourtCount,
                'courtOccupancy' => $courtCount ? round(($activeCourtCount / $courtCount) * 100) : 0,
                'playersCheckedIn' => Reservation::query()->whereDate('reservation_date', $today)->whereIn('booking_status', ['checked_in', 'playing'])->sum('players_count'),
                'openPlayPlayers' => OpenPlayPlayer::query()->whereBetween('created_at', [$startOfDay, $endOfDay])->count(),
                'posSales' => (float) PosTransaction::query()->whereBetween('created_at', [$startOfDay, $endOfDay])->sum('total_amount'),
                'outstandingBalances' => (float) Reservation::query()->where('payment_status', '!=', 'paid')->sum('amount_due'),
            ],
            'chartData' => $this->chartData(),
            'courtsNow' => $this->courtsNow(),
            'reservations' => $this->todayReservations(),
        ]);
    }

    private function frontDeskDashboard(): Response
    {
        $today = $this->clock->today()->toDateString();
        [$startOfDay, $endOfDay] = $this->clock->dayRange();

        return Inertia::render('dashboard', [
            'mode' => 'front_desk',
            'role' => 'front_desk',
            'title' => 'Front Desk Command Center',
            'subtitle' => 'Today&apos;s reservations, check-ins, walk-ins, court readiness, and live player flow.',
            'metrics' => [
                'reservationsToday' => Reservation::query()->whereDate('reservation_date', $today)->count(),
                'pendingCheckIns' => Reservation::query()->whereDate('reservation_date', $today)->where('booking_status', 'confirmed')->count(),
                'playersCheckedIn' => Reservation::query()->whereDate('reservation_date', $today)->whereIn('booking_status', ['checked_in', 'playing'])->sum('players_count'),
                'availableCourts' => Court::query()->where('status', 'available')->count(),
                'liveCourts' => Court::query()->whereIn('status', ['occupied', 'open_play'])->count(),
                'openPlayPlayers' => OpenPlayPlayer::query()->whereBetween('created_at', [$startOfDay, $endOfDay])->count(),
            ],
            'chartData' => $this->chartData(),
            'courtsNow' => $this->courtsNow(),
            'reservations' => $this->todayReservations(),
        ]);
    }

    private function cashierDashboard(int $userId): Response
    {
        [$startOfDay, $endOfDay] = $this->clock->dayRange();

        $openSession = CashierSession::query()
            ->with('branch')
            ->where('user_id', $userId)
            ->where('status', 'open')
            ->first();

        return Inertia::render('dashboard', [
            'mode' => 'cashier',
            'role' => 'cashier',
            'title' => 'Cashier Station',
            'subtitle' => 'Open till status, today&apos;s payments, POS sales, and recent transactions.',
            'metrics' => [
                'posSales' => (float) PosTransaction::query()->whereBetween('created_at', [$startOfDay, $endOfDay])->sum('total_amount'),
                'cashPayments' => (float) Payment::query()->whereBetween('paid_at', [$startOfDay, $endOfDay])->where('method', 'cash')->sum('amount'),
                'digitalPayments' => (float) Payment::query()->whereBetween('paid_at', [$startOfDay, $endOfDay])->where('method', '!=', 'cash')->sum('amount'),
                'transactionsToday' => PosTransaction::query()->whereBetween('created_at', [$startOfDay, $endOfDay])->count(),
                'openCashierSessions' => CashierSession::query()->where('status', 'open')->count(),
                'lowStock' => Product::query()->whereColumn('stock_on_hand', '<=', 'reorder_point')->count(),
            ],
            'chartData' => $this->chartData(),
            'openSession' => $openSession,
            'transactions' => PosTransaction::query()->with(['items', 'branch'])->latest()->limit(8)->get(),
        ]);
    }

    private function sportsDashboard(string $role): Response
    {
        $today = $this->clock->today()->toDateString();
        [$startOfDay, $endOfDay] = $this->clock->dayRange();

        return Inertia::render('dashboard', [
            'mode' => 'sports',
            'role' => $role,
            'title' => $role === 'tournament_director' ? 'Competition Command Center' : 'Scorekeeper Console',
            'subtitle' => 'Live matches, court assignments, open play queues, and ranking movement.',
            'metrics' => [
                'liveMatches' => ClubMatch::query()->where('status', 'live')->count(),
                'completedMatchesToday' => ClubMatch::query()->where('status', 'completed')->whereBetween('updated_at', [$startOfDay, $endOfDay])->count(),
                'openPlaySessions' => OpenPlaySession::query()->whereDate('session_date', $today)->count(),
                'openPlayPlayers' => OpenPlayPlayer::query()->whereBetween('created_at', [$startOfDay, $endOfDay])->count(),
                'liveCourts' => Court::query()->whereIn('status', ['occupied', 'open_play'])->count(),
                'rankedPlayers' => Player::query()->where('total_reservations', '>', 0)->count(),
            ],
            'chartData' => $this->chartData(),
            'courtsNow' => $this->courtsNow(),
            'matches' => ClubMatch::query()->with(['court.branch'])->latest()->limit(8)->get(),
        ]);
    }

    private function playerDashboard(int $userId): Response
    {
        $profile = PlayerProfile::query()->where('user_id', $userId)->first();

        return Inertia::render('dashboard', [
            'mode' => 'player',
            'role' => 'player',
            'title' => 'Player Home',
            'subtitle' => 'One CourtPrime profile, connected clubs, upcoming games, and verified playing record.',
            'playerProfile' => $profile,
            'metrics' => [
                'globalRating' => (float) ($profile?->global_rating ?? 2.50),
                'globalMatches' => $profile?->global_match_count ?? 0,
                'wins' => $profile?->wins ?? 0,
                'losses' => $profile?->losses ?? 0,
                'connectedClubs' => $profile
                    ? OrganizationPlayer::query()->withoutGlobalScope('organization')->where('player_profile_id', $profile->id)->count()
                    : 0,
            ],
            'chartData' => $this->chartData(),
            'reservations' => $this->todayReservations(),
        ]);
    }

    private function chartData(bool $global = false): array
    {
        return collect(range(6, 0))->map(function (int $daysAgo) use ($global) {
            $date = $this->clock->today()->subDays($daysAgo);
            [$startOfDay, $endOfDay] = $this->clock->dayRange($date);
            $reservations = $global ? Reservation::withoutGlobalScope('organization') : Reservation::query();
            $payments = $global ? Payment::withoutGlobalScope('organization') : Payment::query();
            $courts = $global ? Court::withoutGlobalScope('organization') : Court::query();
            $activeCourts = (clone $courts)->whereIn('status', ['occupied', 'reserved', 'open_play'])->count();
            $courtCount = (clone $courts)->count();

            return [
                'label' => $date->format('M j'),
                'revenue' => (float) (clone $payments)->whereBetween('paid_at', [$startOfDay, $endOfDay])->sum('amount'),
                'reservations' => (clone $reservations)->whereDate('reservation_date', $date->toDateString())->count(),
                'occupancy' => $courtCount ? round(($activeCourts / $courtCount) * 100) : 0,
            ];
        })->values()->all();
    }

    private function courtsNow()
    {
        return Court::query()
            ->with(['branch', 'matches' => fn ($query) => $query->where('status', 'live')->latest()->limit(1)])
            ->orderBy('court_number')
            ->get();
    }

    private function todayReservations()
    {
        return Reservation::query()
            ->with(['court', 'player'])
            ->whereDate('reservation_date', $this->clock->today()->toDateString())
            ->orderBy('start_time')
            ->limit(8)
            ->get();
    }
}
