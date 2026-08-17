<?php

namespace App\Http\Controllers;

use App\Models\CourtPrimeNotification;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationCenterController extends Controller
{
    public function index(Request $request, TenantContext $tenantContext): Response
    {
        $query = $this->visibleNotifications($request, $tenantContext);

        return Inertia::render('notifications', [
            'notifications' => (clone $query)->latest()->paginate(20),
            'unreadCount' => (clone $query)->whereNull('read_at')->count(),
        ]);
    }

    public function markRead(Request $request, CourtPrimeNotification $courtPrimeNotification, TenantContext $tenantContext): RedirectResponse
    {
        abort_unless($this->canAccess($request, $tenantContext, $courtPrimeNotification), 403);

        $courtPrimeNotification->update(['read_at' => now()]);

        return back()->with('success', 'CourtPrime notification marked as read.');
    }

    private function visibleNotifications(Request $request, TenantContext $tenantContext)
    {
        $user = $request->user();
        $organizationId = $tenantContext->currentOrganizationId();
        $profileId = $user->playerProfile?->id;

        return CourtPrimeNotification::query()
            ->where(function ($query) use ($user, $organizationId, $profileId) {
                $query->where('user_id', $user->id);

                if ($profileId) {
                    $query->orWhere('player_profile_id', $profileId);
                }

                if ($organizationId) {
                    $query->orWhere(function ($query) use ($organizationId) {
                        $query->where('organization_id', $organizationId)->whereNull('user_id')->whereNull('player_profile_id');
                    });
                }

                if ($user->is_superadmin) {
                    $query->orWhere(function ($query) {
                        $query->whereNull('organization_id')->whereNull('user_id')->whereNull('player_profile_id');
                    });
                }
            });
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
