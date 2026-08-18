<?php

namespace App\Http\Middleware;

use App\Models\CourtPrimeNotification;
use App\Models\DemoRequest;
use App\Models\AccountReceivable;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\SupportTicket;
use App\Services\BranchClock;
use App\Services\TenantContext;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $tenantContext = app(TenantContext::class);

        return array_merge(parent::share($request), [
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
            ],
            'workspace' => $tenantContext->inertiaShare(),
            'navBadges' => fn () => $this->navBadges($request, $tenantContext),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'api_token_once' => fn () => $request->session()->get('api_token_once'),
                /* Set when joining an open play session grants board access,
                   so the page can offer to open the board. */
                'board_url' => fn () => $request->session()->get('boardUrl'),
            ],
        ]);
    }

    /**
     * @return array<string, int>
     */
    private function navBadges(Request $request, TenantContext $tenantContext): array
    {
        $user = $request->user();

        if (! $user) {
            return [];
        }

        $organizationId = $tenantContext->currentOrganizationId() ?? 0;
        $branchId = $tenantContext->currentBranchId() ?? 0;

        return Cache::remember("courtprime.nav-badges.{$user->id}.{$organizationId}.{$branchId}", 60, function () use ($user, $tenantContext) {
            $branchId = $tenantContext->currentBranchId();
            $today = app(BranchClock::class)->today()->toDateString();

            return [
                '/reservations' => Reservation::query()
                    ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                    ->whereDate('reservation_date', $today)
                    ->whereIn('booking_status', ['confirmed', 'checked_in', 'playing'])
                    ->count(),
                '/payments' => Payment::query()
                    ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                    ->whereIn('status', ['pending', 'partial', 'partially_refunded'])
                    ->count(),
                '/accounts-receivable' => AccountReceivable::query()
                    ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                    ->whereIn('status', ['open', 'partial', 'overdue'])
                    ->count(),
                '/inventory' => Product::query()
                    ->whereColumn('stock_on_hand', '<=', 'reorder_point')
                    ->count(),
                '/support-tickets' => SupportTicket::query()
                    ->when(! $user->is_superadmin, fn ($query) => $query->where('organization_id', $tenantContext->currentOrganizationId()))
                    ->whereIn('status', ['open', 'pending'])
                    ->count(),
                '/demo-pipeline' => $user->is_superadmin
                    ? DemoRequest::query()->whereIn('status', ['new', 'contacted', 'qualified'])->count()
                    : 0,
                '/notifications' => CourtPrimeNotification::query()
                    ->where('user_id', $user->id)
                    ->whereNull('read_at')
                    ->count(),
            ];
        });
    }
}
