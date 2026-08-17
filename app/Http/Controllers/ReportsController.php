<?php

namespace App\Http\Controllers;

use App\Models\Court;
use App\Models\Branch;
use App\Models\Expense;
use App\Models\Organization;
use App\Models\OrganizationPlayer;
use App\Models\Payment;
use App\Models\PlayerProfile;
use App\Models\Refund;
use App\Models\Reservation;
use App\Services\SubscriptionFeatureGate;
use App\Services\TenantContext;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportsController extends Controller
{
    public function __invoke(Request $request, TenantContext $tenantContext, SubscriptionFeatureGate $subscriptionGate): Response|StreamedResponse
    {
        $this->authorize('viewAny', Reservation::class);
        $subscriptionGate->ensureAnyFeatureEnabled($tenantContext->currentOrganization(), ['advanced_analytics', 'basic_reporting'], 'reports and analytics');

        $start = CarbonImmutable::parse((string) $request->query('start', today()->subDays(29)->toDateString()))->toDateString();
        $end = CarbonImmutable::parse((string) $request->query('end', today()->toDateString()))->toDateString();
        $global = (bool) $request->user()?->is_superadmin;
        $branchId = $request->integer('branch_id') ?: null;
        $courtId = $request->integer('court_id') ?: null;

        $reservations = ($global ? Reservation::withoutGlobalScope('organization') : Reservation::query())
            ->with(['court.branch', 'player'])
            ->whereBetween('reservation_date', [$start, $end])
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->when($courtId, fn ($query) => $query->where('court_id', $courtId))
            ->get();

        $reservationIds = $reservations->pluck('id');

        $payments = ($global ? Payment::withoutGlobalScope('organization') : Payment::query())
            ->whereBetween('paid_at', [$start.' 00:00:00', $end.' 23:59:59'])
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->when($courtId, fn ($query) => $query->whereIn('reservation_id', $reservationIds))
            ->get();

        $refunds = ($global ? Refund::withoutGlobalScope('organization') : Refund::query())
            ->where('status', 'processed')
            ->whereBetween('processed_at', [$start.' 00:00:00', $end.' 23:59:59'])
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->when($courtId, fn ($query) => $query->whereHas('payment', fn ($query) => $query->whereIn('reservation_id', $reservationIds)))
            ->get();

        $expenses = ($global ? Expense::withoutGlobalScope('organization') : Expense::query())
            ->whereIn('status', ['approved', 'paid'])
            ->whereBetween('expense_date', [$start, $end])
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->get();

        $days = collect();
        $cursor = CarbonImmutable::parse($start);
        $last = CarbonImmutable::parse($end);

        while ($cursor->lte($last)) {
            $date = $cursor->toDateString();
            $days->push([
                'label' => $cursor->format('M j'),
                'revenue' => (float) $payments->where(fn (Payment $payment) => $payment->paid_at?->toDateString() === $date)->sum('amount'),
                'refunds' => (float) $refunds->where(fn (Refund $refund) => $refund->processed_at?->toDateString() === $date)->sum('amount'),
                'expenses' => (float) $expenses->where(fn (Expense $expense) => $expense->expense_date?->toDateString() === $date)->sum('amount'),
                'reservations' => $reservations->where(fn (Reservation $reservation) => $reservation->reservation_date?->toDateString() === $date)->count(),
                'players' => $reservations->where(fn (Reservation $reservation) => $reservation->reservation_date?->toDateString() === $date)->sum('players_count'),
            ]);
            $cursor = $cursor->addDay();
        }

        $courtUsage = ($global ? Court::withoutGlobalScope('organization') : Court::query())
            ->with('branch')
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->when($courtId, fn ($query) => $query->whereKey($courtId))
            ->get()
            ->map(fn (Court $court) => [
                'court' => $court->branch?->code.' '.$court->name,
                'minutes' => $reservations->where('court_id', $court->id)->sum('duration_minutes'),
                'reservations' => $reservations->where('court_id', $court->id)->count(),
            ])
            ->sortByDesc('minutes')
            ->values();

        $heatmap = $reservations
            ->groupBy(fn (Reservation $reservation) => ($reservation->reservation_date?->format('D') ?? 'Pending').' '.substr((string) $reservation->start_time, 0, 2).':00')
            ->map(fn ($group, string $key) => [
                'slot' => $key,
                'reservations' => $group->count(),
                'minutes' => $group->sum('duration_minutes'),
                'players' => $group->sum('players_count'),
            ])
            ->sortByDesc('minutes')
            ->take(20)
            ->values();

        $playerActivity = $global
            ? PlayerProfile::query()
                ->orderByDesc('global_match_count')
                ->orderByDesc('global_rating')
                ->limit(10)
                ->get(['courtprime_player_id', 'display_name', 'global_rating', 'global_match_count', 'wins', 'losses'])
                ->map(fn (PlayerProfile $profile) => [
                    'name' => $profile->display_name,
                    'courtprime_player_id' => $profile->courtprime_player_id,
                    'rating' => $profile->global_rating,
                    'matches' => $profile->global_match_count,
                    'wins' => $profile->wins,
                    'losses' => $profile->losses,
                ])
            : OrganizationPlayer::query()
                ->with('playerProfile:id,courtprime_player_id,display_name,global_rating,global_match_count,wins,losses')
                ->orderByDesc('last_visit_at')
                ->limit(10)
                ->get()
                ->map(fn (OrganizationPlayer $organizationPlayer) => [
                    'name' => $organizationPlayer->playerProfile?->display_name,
                    'courtprime_player_id' => $organizationPlayer->playerProfile?->courtprime_player_id,
                    'rating' => $organizationPlayer->playerProfile?->global_rating,
                    'matches' => $organizationPlayer->playerProfile?->global_match_count,
                    'wins' => $organizationPlayer->playerProfile?->wins,
                    'losses' => $organizationPlayer->playerProfile?->losses,
                ]);

        $revenue = (float) $payments->sum('amount');
        $refundTotal = (float) $refunds->sum('amount');
        $expenseTotal = (float) $expenses->sum('amount');
        $netRevenue = $revenue - $refundTotal;
        $profit = $netRevenue - $expenseTotal;

        if ($request->query('export') === 'csv') {
            return $this->exportCsv($days, [
                'revenue' => $revenue,
                'refunds' => $refundTotal,
                'net_revenue' => $netRevenue,
                'expenses' => $expenseTotal,
                'profit' => $profit,
                'reservations' => $reservations->count(),
                'player_visits' => $reservations->sum('players_count'),
            ]);
        }

        $branches = ($global ? Branch::withoutGlobalScope('organization') : Branch::query())
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $courts = ($global ? Court::withoutGlobalScope('organization') : Court::query())
            ->with('branch:id,name,code')
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->orderBy('branch_id')
            ->orderBy('court_number')
            ->get(['id', 'branch_id', 'name', 'court_number']);

        return Inertia::render('reports', [
            'filters' => ['start' => $start, 'end' => $end, 'branch_id' => $branchId, 'court_id' => $courtId],
            'branches' => $branches,
            'courts' => $courts,
            'scope' => $global ? 'network' : 'workspace',
            'metrics' => [
                'revenue' => $revenue,
                'refunds' => $refundTotal,
                'netRevenue' => $netRevenue,
                'expenses' => $expenseTotal,
                'profit' => $profit,
                'reservations' => $reservations->count(),
                'players' => $reservations->sum('players_count'),
                'activePlayers' => ($global ? OrganizationPlayer::withoutGlobalScope('organization') : OrganizationPlayer::query())->where('status', 'active')->count(),
                'averageTicket' => $payments->count() ? round((float) $payments->avg('amount'), 2) : 0,
            ],
            'networkMetrics' => $global ? [
                'organizations' => Organization::query()->count(),
                'globalPlayers' => PlayerProfile::query()->count(),
                'connectedCourts' => Court::withoutGlobalScope('organization')->count(),
                'networkReservations' => Reservation::withoutGlobalScope('organization')->whereBetween('reservation_date', [$start, $end])->count(),
            ] : null,
            'daily' => $days,
            'courtUsage' => $courtUsage,
            'heatmap' => $heatmap,
            'playerActivity' => $playerActivity,
        ]);
    }

    private function exportCsv($days, array $metrics): StreamedResponse
    {
        return response()->streamDownload(function () use ($days, $metrics) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['CourtPrime Report Summary']);
            fputcsv($handle, array_keys($metrics));
            fputcsv($handle, array_values($metrics));
            fputcsv($handle, []);
            fputcsv($handle, ['Date', 'Revenue', 'Refunds', 'Expenses', 'Reservations', 'Player Visits']);

            foreach ($days as $day) {
                fputcsv($handle, [
                    $day['label'],
                    $day['revenue'],
                    $day['refunds'],
                    $day['expenses'],
                    $day['reservations'],
                    $day['players'],
                ]);
            }

            fclose($handle);
        }, 'courtprime-report-'.now()->format('Ymd-His').'.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }
}
