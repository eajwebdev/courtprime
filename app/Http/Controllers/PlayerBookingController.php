<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlayerBookingStoreRequest;
use App\Models\Court;
use App\Models\PlayerMembership;
use App\Services\CourtAvailabilityService;
use App\Services\PlayerProfileResolver;
use App\Services\ReservationService;
use App\Support\NetworkClock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlayerBookingController extends Controller
{
    /**
     * The booking grid, with or without an account.
     *
     * A visitor deciding whether to come down on Saturday needs to see what is
     * free before signing up for anything, so this renders for guests too. What
     * needs an account is taking a court, which is the POST, and the grid sends
     * them to sign in at the moment they pick a time rather than at the door.
     */
    public function index(Request $request, PlayerProfileResolver $profiles, CourtAvailabilityService $availability): Response
    {
        $profile = $request->user() ? $profiles->forUser($request->user()) : null;
        /* Club-local today, not UTC today. See NetworkClock. */
        $date = $request->query('date', NetworkClock::today());
        $search = trim((string) $request->query('search', ''));
        /* Discovery links straight to a court, so the page can preselect it. */
        $selectedCourtId = $request->integer('court') ?: null;

        $courts = Court::query()
            ->withoutGlobalScope('organization')
            ->with(['branch.organization'])
            ->whereIn('status', ['available', 'reserved', 'occupied', 'open_play'])
            ->whereHas('branch', fn ($query) => $query
                ->withoutGlobalScope('organization')
                ->where('status', 'active')
                ->whereHas('organization', fn ($query) => $query->whereIn('status', ['trial', 'active'])))
            ->when($search, function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhereHas('branch', fn ($query) => $query->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('branch.organization', fn ($query) => $query->where('name', 'like', "%{$search}%"));
                });
            })
            ->orderBy('branch_id')
            ->orderBy('court_number')
            ->get()
            ->map(fn (Court $court) => [
                'id' => $court->id,
                'name' => $court->name,
                'court_type' => $court->court_type,
                'environment' => $court->environment,
                'surface_type' => $court->surface_type,
                'capacity' => $court->capacity,
                'standard_hourly_rate' => $court->standard_hourly_rate,
                'member_hourly_rate' => $court->member_hourly_rate,
                'status' => $court->status,
                'amenities' => $court->amenities ?? [],
                'branch' => [
                    'id' => $court->branch?->id,
                    'name' => $court->branch?->name,
                    'address' => $court->branch?->address,
                    'organization_id' => $court->branch?->organization?->id,
                    'organization' => $court->branch?->organization?->name,
                ],
                'has_membership_rate' => $profile ? $this->hasActiveMembership($profile->id, (int) $court->organization_id) : false,
                /*
                 * The whole day is returned, not just the first ten free slots.
                 * The booking grid needs the unavailable ones too so taken
                 * times render as disabled rather than silently disappearing,
                 * and so a duration can be checked against contiguous slots.
                 */
                'slots' => collect($availability->slots($court, $date))->values(),
            ]);

        return Inertia::render('player-booking', [
            'profile' => $profile ? [
                'courtprime_player_id' => $profile->courtprime_player_id,
                'display_name' => $profile->display_name,
                'gender' => $profile->gender,
                'avatar_url' => $profile->avatar_url,
            ] : null,
            'date' => $date,
            'search' => $search,
            'selectedCourtId' => $selectedCourtId,
            'courts' => $courts,
        ]);
    }

    public function store(PlayerBookingStoreRequest $request, PlayerProfileResolver $profiles, ReservationService $reservations): RedirectResponse
    {
        $profile = $profiles->forUser($request->user());
        $validated = $request->validated();
        $court = Court::query()->withoutGlobalScope('organization')->findOrFail($validated['court_id']);

        $reservations->create([
            ...$validated,
            'player_name' => $profile->display_name,
            'player_email' => $profile->email,
            'player_mobile_number' => $profile->mobile_number,
            'reservation_type' => 'court_booking',
            'payment_status' => 'unpaid',
            'booking_status' => 'confirmed',
            'source' => 'player_portal',
            'member_rate' => $this->hasActiveMembership($profile->id, (int) $court->organization_id),
        ], crossOrganizationCourtLookup: true);

        return to_route('me')->with('success', 'CourtPrime court booking confirmed.');
    }

    private function hasActiveMembership(int $playerProfileId, int $organizationId): bool
    {
        return PlayerMembership::query()
            ->withoutGlobalScope('organization')
            ->where('player_profile_id', $playerProfileId)
            ->where('organization_id', $organizationId)
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('ends_on')->orWhereDate('ends_on', '>=', today());
            })
            ->exists();
    }
}
