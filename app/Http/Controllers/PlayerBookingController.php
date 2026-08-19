<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlayerBookingStoreRequest;
use App\Models\Court;
use App\Models\OrganizationPlayer;
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

        /*
         * The page opens on the first day it can actually sell, and a link to an
         * earlier one is pulled forward rather than rendered as a grid where
         * every slot would be refused on submit. Club-local, not UTC — see
         * NetworkClock.
         */
        $firstBookable = NetworkClock::firstBookableDate();
        $date = max((string) $request->query('date', $firstBookable), $firstBookable);
        $search = trim((string) $request->query('search', ''));
        /* Discovery links straight to a court, so the page can preselect it. */
        $selectedCourtId = $request->integer('court') ?: null;

        /*
         * The club-side player records behind this identity, so the grid can
         * say "Your booking" instead of showing the player their own name back
         * as if it were a stranger's.
         */
        $ownPlayerIds = $profile
            ? OrganizationPlayer::query()
                ->withoutGlobalScope('organization')
                ->where('player_profile_id', $profile->id)
                ->whereNotNull('legacy_player_id')
                ->pluck('legacy_player_id')
                ->map(fn ($id) => (int) $id)
                ->all()
            : [];

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
            ->get();

        /* Every court's day in two queries, rather than two per half hour. */
        $days = $availability->slotsFor($courts, $date, $ownPlayerIds);

        $courts = $courts
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
                    'contact_number' => $court->branch?->contact_number,
                    'operating_hours' => $court->branch?->operating_hours,
                    'organization_id' => $court->branch?->organization?->id,
                    'organization' => $court->branch?->organization?->name,
                    /*
                     * Clubs are reached through this page now rather than a
                     * separate profile, so what that page carried has to be
                     * here: the club's own channels, kept in the settings JSON
                     * so adding one needs no migration.
                     */
                    'links' => array_filter([
                        'website' => $court->branch?->organization?->settings['website'] ?? null,
                        'facebook' => $court->branch?->organization?->settings['facebook'] ?? null,
                        'instagram' => $court->branch?->organization?->settings['instagram'] ?? null,
                        'tiktok' => $court->branch?->organization?->settings['tiktok'] ?? null,
                    ]),
                ],
                'has_membership_rate' => $profile ? $this->hasActiveMembership($profile->id, (int) $court->organization_id) : false,
                /*
                 * The whole day is returned, not just the first ten free slots.
                 * The booking grid needs the taken ones too — each carrying who
                 * or what is holding it — so a taken time reads as a named
                 * block rather than silently disappearing, and so a duration
                 * can be checked against contiguous slots.
                 */
                'slots' => $days[$court->id] ?? [],
            ])
            ->values();

        return Inertia::render('player-booking', [
            'profile' => $profile ? [
                'courtprime_player_id' => $profile->courtprime_player_id,
                'display_name' => $profile->display_name,
                'gender' => $profile->gender,
                'avatar_url' => $profile->avatar_url,
            ] : null,
            'date' => $date,
            /* The rail and the calendar both start here rather than at today. */
            'firstBookableDate' => $firstBookable,
            'maxHours' => CourtAvailabilityService::MAX_HOURS,
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
