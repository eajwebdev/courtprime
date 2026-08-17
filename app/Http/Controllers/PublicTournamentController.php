<?php

namespace App\Http\Controllers;

use App\Http\Requests\TournamentRegistrationStoreRequest;
use App\Models\Tournament;
use App\Models\TournamentDivision;
use App\Models\TournamentRegistration;
use App\Services\PlayerIdentityService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PublicTournamentController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $date = $request->query('date');

        $tournaments = $this->publicTournamentQuery()
            ->with([
                'branch.organization',
                'divisions' => fn ($query) => $query
                    ->where('status', 'open')
                    ->withCount(['registrations as registrations_count' => fn ($query) => $query->whereIn('status', ['registered', 'checked_in'])])
                    ->orderBy('name'),
            ])
            ->withCount(['registrations as registrations_count' => fn ($query) => $query->whereIn('status', ['registered', 'checked_in'])])
            ->when($search, function (Builder $query) use ($search) {
                $query->where(function (Builder $query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhereHas('branch', fn (Builder $query) => $query->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('branch.organization', fn (Builder $query) => $query->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($date, fn (Builder $query) => $query->whereDate('starts_on', '>=', $date))
            ->orderBy('starts_on')
            ->paginate(12)
            ->through(fn (Tournament $tournament) => [
                'id' => $tournament->id,
                'name' => $tournament->name,
                'starts_on' => $tournament->starts_on?->toDateString(),
                'ends_on' => $tournament->ends_on?->toDateString(),
                'format' => $tournament->format,
                'entry_fee' => $tournament->entry_fee,
                'status' => $tournament->status,
                'max_players' => $tournament->max_players,
                'registrations_count' => $tournament->registrations_count,
                'registration_closes_at' => $tournament->registration_closes_at?->toDateTimeString(),
                'registration_open' => $this->isRegistrationOpen($tournament),
                'branch' => [
                    'name' => $tournament->branch?->name,
                    'address' => $tournament->branch?->address,
                    'organization' => $tournament->branch?->organization?->name,
                ],
                'divisions' => $tournament->divisions->map(fn (TournamentDivision $division) => [
                    'id' => $division->id,
                    'name' => $division->name,
                    'skill_level' => $division->skill_level,
                    'match_type' => $division->match_type,
                    'gender_policy' => $division->gender_policy,
                    'max_teams' => $division->max_teams,
                    'registrations_count' => $division->registrations_count,
                ])->values(),
            ]);

        return Inertia::render('tournament-discovery', [
            'search' => $search,
            'date' => $date,
            'tournaments' => $tournaments,
        ]);
    }

    public function register(TournamentRegistrationStoreRequest $request, PlayerIdentityService $playerIdentity, int $tournamentId): RedirectResponse
    {
        $tournament = $this->publicTournamentQuery()
            ->with(['divisions' => fn ($query) => $query->where('status', 'open')])
            ->withCount(['registrations as registrations_count' => fn ($query) => $query->whereIn('status', ['registered', 'checked_in'])])
            ->findOrFail($tournamentId);

        if (! $this->isRegistrationOpen($tournament)) {
            throw ValidationException::withMessages([
                'tournament_division_id' => 'Registration is not open for this tournament.',
            ]);
        }

        $validated = $request->validated();
        $division = $tournament->divisions->firstWhere('id', (int) $validated['tournament_division_id']);

        if (! $division) {
            throw ValidationException::withMessages([
                'tournament_division_id' => 'Choose an open division for this tournament.',
            ]);
        }

        if ($this->divisionIsFull($division)) {
            throw ValidationException::withMessages([
                'tournament_division_id' => 'This division has reached its registration limit.',
            ]);
        }

        return DB::transaction(function () use ($playerIdentity, $tournament, $division, $validated) {
            $organizationPlayer = $playerIdentity->findOrCreateOrganizationPlayer($tournament->organization_id, [
                'player_name' => $validated['player_name'],
                'player_email' => $validated['player_email'],
                'player_mobile_number' => $validated['player_mobile_number'] ?? null,
                'skill_level' => $validated['skill_level'] ?? 'beginner',
                'membership_status' => 'guest',
            ]);

            $alreadyRegistered = TournamentRegistration::query()
                ->withoutGlobalScope('organization')
                ->where('tournament_id', $tournament->id)
                ->where('tournament_division_id', $division->id)
                ->where('player_profile_id', $organizationPlayer->player_profile_id)
                ->whereIn('status', ['registered', 'checked_in'])
                ->exists();

            if ($alreadyRegistered) {
                throw ValidationException::withMessages([
                    'player_email' => 'This CourtPrime player is already registered in that division.',
                ]);
            }

            TournamentRegistration::query()->create([
                'organization_id' => $tournament->organization_id,
                'tournament_id' => $tournament->id,
                'tournament_division_id' => $division->id,
                'player_profile_id' => $organizationPlayer->player_profile_id,
                'organization_player_id' => $organizationPlayer->id,
                'player_name' => $organizationPlayer->playerProfile->display_name,
                'partner_name' => $validated['partner_name'] ?? null,
                'payment_status' => ((float) $tournament->entry_fee) > 0 ? 'pending' : 'waived',
                'status' => 'registered',
                'registered_at' => now(),
            ]);

            return back()->with('success', 'Tournament registration submitted.');
        });
    }

    private function publicTournamentQuery(): Builder
    {
        return Tournament::query()
            ->withoutGlobalScope('organization')
            ->where('visibility', 'public')
            ->whereIn('status', ['published', 'registration_open', 'live'])
            ->whereHas('branch', fn (Builder $query) => $query
                ->withoutGlobalScope('organization')
                ->where('status', 'active')
                ->whereHas('organization', fn (Builder $query) => $query->whereIn('status', ['trial', 'active'])));
    }

    private function isRegistrationOpen(Tournament $tournament): bool
    {
        if ($tournament->status !== 'registration_open') {
            return false;
        }

        if ($tournament->registration_opens_at && now()->lt($tournament->registration_opens_at)) {
            return false;
        }

        if ($tournament->registration_closes_at && now()->gt($tournament->registration_closes_at)) {
            return false;
        }

        if ($tournament->max_players && $tournament->registrations_count >= $tournament->max_players) {
            return false;
        }

        return true;
    }

    private function divisionIsFull(TournamentDivision $division): bool
    {
        return $division->max_teams
            && $division->registrations()->withoutGlobalScope('organization')->whereIn('status', ['registered', 'checked_in'])->count() >= $division->max_teams;
    }
}
