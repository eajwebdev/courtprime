<?php

namespace App\Http\Controllers;

use App\Models\CourtPrimeNotification;
use App\Services\NotificationService;
use App\Services\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationCenterController extends Controller
{
    public function index(Request $request, TenantContext $tenantContext): Response
    {
        $query = $this->visibleNotifications($request, $tenantContext);

        /* Unread first, because a notification centre is a queue of things not
           yet dealt with, not an archive. */
        $filter = $request->query('filter') === 'all' ? 'all' : 'unread';
        $category = $request->query('category');

        $rows = (clone $query)
            ->when($filter === 'unread', fn ($builder) => $builder->whereNull('read_at'))
            ->when($category, fn ($builder) => $builder->where('category', $category))
            ->latest()
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('notifications', [
            'notifications' => $rows,
            'filter' => $filter,
            'category' => $category,
            'unreadCount' => (clone $query)->whereNull('read_at')->count(),
            /* The kinds actually present, so the filter never offers a category
               with nothing behind it. */
            'categories' => (clone $query)
                ->selectRaw('category, COUNT(*) as total, SUM(CASE WHEN read_at IS NULL THEN 1 ELSE 0 END) as unread')
                ->groupBy('category')
                ->orderByDesc('total')
                ->get()
                ->map(fn ($row) => [
                    'category' => (string) $row->category,
                    'total' => (int) $row->total,
                    'unread' => (int) $row->unread,
                ])
                ->all(),
        ]);
    }

    /**
     * The few most recent unread, for the header bell.
     *
     * Its own endpoint rather than a shared Inertia prop: the bell sits on every
     * page in the app and most of them are never opened, so the query is paid
     * for when somebody actually looks rather than on every page load.
     */
    public function recent(Request $request, TenantContext $tenantContext): JsonResponse
    {
        $rows = $this->visibleNotifications($request, $tenantContext)
            ->whereNull('read_at')
            ->latest()
            ->limit(8)
            ->get(['id', 'category', 'title', 'body', 'data', 'created_at']);

        return response()->json([
            'unread' => $this->visibleNotifications($request, $tenantContext)->whereNull('read_at')->count(),
            'notifications' => $rows->map(fn ($row) => [
                'id' => $row->id,
                'category' => $row->category,
                'title' => $row->title,
                'body' => $row->body,
                'url' => $row->data['url'] ?? null,
                'created_at' => $row->created_at?->toIso8601String(),
            ])->all(),
        ]);
    }

    /**
     * Clear the whole queue.
     *
     * Reading thirty notifications one at a time is not triage, it is data
     * entry. Only what the viewer can currently see is marked, so a category
     * filter clears that category and nothing else.
     */
    public function markAllRead(Request $request, TenantContext $tenantContext): RedirectResponse
    {
        $marked = $this->visibleNotifications($request, $tenantContext)
            ->whereNull('read_at')
            ->when($request->query('category'), fn ($builder) => $builder->where('category', $request->query('category')))
            ->update(['read_at' => now()]);

        return back()->with('success', $marked === 1 ? '1 notification marked as read.' : $marked.' notifications marked as read.');
    }

    public function markRead(Request $request, CourtPrimeNotification $courtPrimeNotification, TenantContext $tenantContext): RedirectResponse
    {
        abort_unless($this->canAccess($request, $tenantContext, $courtPrimeNotification), 403);

        $courtPrimeNotification->update(['read_at' => now()]);

        return back()->with('success', 'CourtPrime notification marked as read.');
    }

    private function visibleNotifications(Request $request, TenantContext $tenantContext)
    {
        return app(NotificationService::class)->visibleTo($request->user(), $tenantContext->currentOrganizationId());
    }

    private function canAccess(Request $request, TenantContext $tenantContext, CourtPrimeNotification $notification): bool
    {
        $user = $request->user();

        if ($notification->user_id) {
            return (int) $notification->user_id === (int) $user->id;
        }

        if ($notification->player_profile_id) {
            return $user->playerProfile && (int) $notification->player_profile_id === (int) $user->playerProfile->id;
        }

        if ($notification->organization_id && (int) $notification->organization_id === (int) $tenantContext->currentOrganizationId()) {
            return true;
        }

        return $user->is_superadmin && ! $notification->organization_id;
    }
}
