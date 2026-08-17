<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlayerStoreRequest;
use App\Models\OrganizationPlayer;
use App\Services\PlayerIdentityService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PlayerController extends Controller
{
    public function index(TenantContext $tenantContext): Response
    {
        $this->authorize('viewAny', OrganizationPlayer::class);

        $organizationId = $tenantContext->currentOrganizationId();

        $players = OrganizationPlayer::query()
            ->withoutGlobalScope('organization')
            ->with(['playerProfile', 'legacyPlayer'])
            ->when($organizationId, fn ($query) => $query->where('organization_id', $organizationId))
            ->latest()
            ->paginate(15)
            ->through(fn (OrganizationPlayer $organizationPlayer) => [
                'id' => $organizationPlayer->legacyPlayer?->id,
                'organization_player_id' => $organizationPlayer->id,
                'courtprime_player_id' => $organizationPlayer->playerProfile->courtprime_player_id,
                'name' => $organizationPlayer->playerProfile->display_name,
                'email' => $organizationPlayer->playerProfile->email,
                'mobile_number' => $organizationPlayer->playerProfile->mobile_number,
                'rating' => $organizationPlayer->playerProfile->global_rating,
                'skill_level' => $organizationPlayer->organization_skill_level ?? $organizationPlayer->playerProfile->skill_level,
                'membership_status' => $organizationPlayer->legacyPlayer?->membership_status ?? $organizationPlayer->status,
                'wallet_balance' => $organizationPlayer->wallet_balance ?: ($organizationPlayer->legacyPlayer?->wallet_balance ?? 0),
                'total_reservations' => $organizationPlayer->legacyPlayer?->total_reservations ?? 0,
            ]);

        return Inertia::render('players', [
            'players' => $players,
            'metrics' => [
                'total' => OrganizationPlayer::query()
                    ->withoutGlobalScope('organization')
                    ->when($organizationId, fn ($query) => $query->where('organization_id', $organizationId))
                    ->count(),
                'members' => OrganizationPlayer::query()
                    ->withoutGlobalScope('organization')
                    ->where('status', 'active')
                    ->when($organizationId, fn ($query) => $query->where('organization_id', $organizationId))
                    ->count(),
                'guests' => OrganizationPlayer::query()
                    ->withoutGlobalScope('organization')
                    ->where('status', 'guest')
                    ->when($organizationId, fn ($query) => $query->where('organization_id', $organizationId))
                    ->count(),
                'averageRating' => round((float) OrganizationPlayer::query()
                    ->withoutGlobalScope('organization')
                    ->join('player_profiles', 'player_profiles.id', '=', 'organization_players.player_profile_id')
                    ->when($organizationId, fn ($query) => $query->where('organization_players.organization_id', $organizationId))
                    ->avg('player_profiles.global_rating'), 2),
            ],
        ]);
    }

    public function store(PlayerStoreRequest $request, PlayerIdentityService $playerIdentity, TenantContext $tenantContext): RedirectResponse
    {
        $this->authorize('create', OrganizationPlayer::class);

        $playerIdentity->findOrCreateOrganizationPlayer(
            (int) $tenantContext->currentOrganizationId(),
            $request->validated(),
        );

        return back()->with('success', 'Player created.');
    }
}
