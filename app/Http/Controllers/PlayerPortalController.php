<?php

namespace App\Http\Controllers;

use App\Models\OpenPlayPlayer;
use App\Models\OrganizationPlayer;
use App\Models\PlayerAchievement;
use App\Models\PlayerMembership;
use App\Models\Reservation;
use App\Models\TournamentRegistration;
use App\Services\PlayerProfileResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

class PlayerPortalController extends Controller
{
    public function __invoke(Request $request, PlayerProfileResolver $profiles): Response
    {
        $profile = $profiles->forUser($request->user());
        $organizationPlayers = OrganizationPlayer::query()
            ->withoutGlobalScope('organization')
            ->with(['organization:id,name', 'homeBranch:id,name', 'legacyPlayer:id,wallet_balance'])
            ->where('player_profile_id', $profile->id)
            ->get();

        $legacyPlayerIds = $organizationPlayers->pluck('legacy_player_id')->filter()->values();

        return Inertia::render('player-portal', [
            'profile' => [
                'id' => $profile->id,
                'courtprime_player_id' => $profile->courtprime_player_id,
                'display_name' => $profile->display_name,
                'gender' => $profile->gender,
                'avatar_url' => $profile->avatar_url,
                'action_photo_url' => $profile->action_photo_url,
                'email' => $profile->email,
                'mobile_number' => $profile->mobile_number,
                'home_city' => $profile->home_city,
                'skill_level' => $profile->skill_level,
                'global_rating' => $profile->global_rating,
                'global_match_count' => $profile->global_match_count,
                'wins' => $profile->wins,
                'losses' => $profile->losses,
                'tournaments_played' => $profile->tournaments_played,
                'verification_status' => $profile->verification_status,
            ],
            'identityUrl' => route('player-identities.public', $profile->courtprime_player_id),
            'qrIdentityUrl' => URL::temporarySignedRoute('player-identities.qr', now()->addYear(), [
                'courtprimePlayerId' => $profile->courtprime_player_id,
                'version' => $profile->qr_token_version ?? 1,
            ]),
            'connectedClubs' => $organizationPlayers->map(fn (OrganizationPlayer $organizationPlayer) => [
                'id' => $organizationPlayer->id,
                'organization' => $organizationPlayer->organization?->name,
                'home_branch' => $organizationPlayer->homeBranch?->name,
                'status' => $organizationPlayer->status,
                'local_player_number' => $organizationPlayer->local_player_number,
                'wallet_balance' => $organizationPlayer->wallet_balance ?: ($organizationPlayer->legacyPlayer?->wallet_balance ?? 0),
            ])->values(),
            'reservations' => Reservation::query()
                ->withoutGlobalScope('organization')
                ->with(['branch.organization', 'court'])
                ->whereIn('player_id', $legacyPlayerIds)
                /*
                 * Filtering on the date alone left a booking that finished
                 * earlier today sitting at the top of "Next up". A reservation
                 * is upcoming only until it actually ends.
                 */
                ->where(function ($query) {
                    $query->whereDate('reservation_date', '>', today())
                        ->orWhere(function ($query) {
                            $query->whereDate('reservation_date', today())
                                ->where('end_time', '>=', now()->format('H:i:s'));
                        });
                })
                ->orderBy('reservation_date')
                ->orderBy('start_time')
                ->limit(12)
                ->get()
                ->map(fn (Reservation $reservation) => [
                    'id' => $reservation->id,
                    'reference' => $reservation->reference,
                    'reservation_date' => $reservation->reservation_date?->toDateString(),
                    'start_time' => substr((string) $reservation->start_time, 0, 5),
                    'end_time' => substr((string) $reservation->end_time, 0, 5),
                    'booking_status' => $reservation->booking_status,
                    'payment_status' => $reservation->payment_status,
                    'amount_due' => $reservation->amount_due,
                    'branch' => [
                        'name' => $reservation->branch?->name,
                        'organization' => $reservation->branch?->organization?->name,
                    ],
                    'court' => [
                        'name' => $reservation->court?->name,
                    ],
                ]),
            'memberships' => PlayerMembership::query()
                ->withoutGlobalScope('organization')
                ->with(['plan', 'organizationPlayer.organization:id,name'])
                ->where('player_profile_id', $profile->id)
                ->latest()
                ->get()
                ->map(fn (PlayerMembership $membership) => [
                    'id' => $membership->id,
                    'plan' => $membership->plan?->name,
                    'organization' => $membership->organizationPlayer?->organization?->name,
                    'status' => $membership->status,
                    'starts_on' => $membership->starts_on?->toDateString(),
                    'ends_on' => $membership->ends_on?->toDateString(),
                ]),
            'tournamentRegistrations' => TournamentRegistration::query()
                ->withoutGlobalScope('organization')
                ->with(['tournament.branch.organization', 'division'])
                ->where('player_profile_id', $profile->id)
                ->latest('registered_at')
                ->limit(8)
                ->get()
                ->map(fn (TournamentRegistration $registration) => [
                    'id' => $registration->id,
                    'status' => $registration->status,
                    'payment_status' => $registration->payment_status,
                    'registered_at' => $registration->registered_at?->toDateString(),
                    'division' => $registration->division?->name,
                    'tournament' => [
                        'name' => $registration->tournament?->name,
                        'starts_on' => $registration->tournament?->starts_on?->toDateString(),
                        'branch' => $registration->tournament?->branch?->name,
                        'organization' => $registration->tournament?->branch?->organization?->name,
                    ],
                ]),
            'openPlay' => OpenPlayPlayer::query()
                ->withoutGlobalScope('organization')
                ->with(['session.branch.organization'])
                ->whereIn('player_id', $legacyPlayerIds)
                ->latest()
                ->limit(8)
                ->get()
                ->map(fn (OpenPlayPlayer $player) => [
                    'id' => $player->id,
                    'status' => $player->status,
                    'session' => [
                        'name' => $player->session?->name,
                        'session_date' => $player->session?->session_date?->toDateString(),
                        'start_time' => substr((string) $player->session?->start_time, 0, 5),
                        'branch' => $player->session?->branch?->name,
                        'organization' => $player->session?->branch?->organization?->name,
                    ],
                ]),
            'achievements' => PlayerAchievement::query()
                ->with(['organization:id,name', 'tournament:id,name'])
                ->where('player_profile_id', $profile->id)
                ->where('visibility', 'public')
                ->latest('earned_at')
                ->limit(8)
                ->get()
                ->map(fn (PlayerAchievement $achievement) => [
                    'id' => $achievement->id,
                    'title' => $achievement->title,
                    'description' => $achievement->description,
                    'earned_at' => $achievement->earned_at?->toDateString(),
                    'organization' => $achievement->organization?->name,
                    'tournament' => $achievement->tournament?->name,
                ]),
        ]);
    }
}
