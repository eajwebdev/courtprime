<?php

namespace App\Http\Controllers;

use App\Events\TournamentBracketUpdated;
use App\Http\Requests\TournamentBracketGenerateRequest;
use App\Http\Requests\TournamentStoreRequest;
use App\Models\Branch;
use App\Models\Tournament;
use App\Models\TournamentDivision;
use App\Services\TournamentBracketService;
use App\Services\SubscriptionFeatureGate;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TournamentController extends Controller
{
    public function index(TenantContext $tenantContext, SubscriptionFeatureGate $subscriptionGate): Response
    {
        $this->authorize('viewAny', Tournament::class);
        $subscriptionGate->ensureAnyFeatureEnabled($tenantContext->currentOrganization(), ['tournaments'], 'tournaments');

        return Inertia::render('tournaments', [
            'tournaments' => Tournament::query()
                ->with([
                    'branch',
                    'divisions' => fn ($query) => $query
                        ->with([
                            'bracketMatches' => fn ($query) => $query
                                ->with(['teamOne:id,player_name,partner_name,seed', 'teamTwo:id,player_name,partner_name,seed', 'winner:id,player_name,partner_name,seed'])
                                ->orderBy('round_number')
                                ->orderBy('match_number'),
                        ])
                        ->withCount([
                            'registrations as registrations_count' => fn ($query) => $query->whereIn('status', ['registered', 'checked_in']),
                            'bracketMatches as bracket_matches_count',
                        ])
                        ->orderBy('name'),
                    'registrations' => fn ($query) => $query
                        ->with(['division:id,name', 'playerProfile:id,courtprime_player_id,display_name,global_rating'])
                        ->latest('registered_at'),
                ])
                ->withCount('registrations')
                ->latest('starts_on')
                ->paginate(15),
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    public function generateBracket(TournamentBracketGenerateRequest $request, Tournament $tournament, TournamentBracketService $brackets, TenantContext $tenantContext, SubscriptionFeatureGate $subscriptionGate): RedirectResponse
    {
        $this->authorize('update', $tournament);
        $subscriptionGate->ensureAnyFeatureEnabled($tenantContext->currentOrganization(), ['tournaments'], 'tournaments');

        $validated = $request->validated();
        $division = TournamentDivision::query()->findOrFail($validated['tournament_division_id']);

        $matchCount = $brackets->generate($tournament, $division, (bool) ($validated['overwrite'] ?? false));
        event(new TournamentBracketUpdated($tournament, $matchCount));

        return back()->with('success', "CourtPrime bracket generated with {$matchCount} first-round matches.");
    }

    public function store(TournamentStoreRequest $request, TenantContext $tenantContext, SubscriptionFeatureGate $subscriptionGate): RedirectResponse
    {
        $this->authorize('create', Tournament::class);
        $subscriptionGate->ensureAnyFeatureEnabled($tenantContext->currentOrganization(), ['tournaments'], 'tournaments');

        $validated = $request->validated();
        $branch = Branch::query()->findOrFail($validated['branch_id']);

        return DB::transaction(function () use ($validated, $branch) {
            $slug = $this->slug($branch->organization_id, $validated['name']);

            $tournament = Tournament::query()->create([
                'organization_id' => $branch->organization_id,
                'branch_id' => $branch->id,
                'name' => $validated['name'],
                'slug' => $slug,
                'starts_on' => $validated['starts_on'],
                'ends_on' => $validated['ends_on'] ?? $validated['starts_on'],
                'registration_opens_at' => $validated['registration_opens_at'] ?? null,
                'registration_closes_at' => $validated['registration_closes_at'] ?? null,
                'format' => $validated['format'],
                'visibility' => $validated['visibility'],
                'max_players' => $validated['max_players'] ?? null,
                'entry_fee' => $validated['entry_fee'],
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
            ]);

            TournamentDivision::query()->create([
                'organization_id' => $branch->organization_id,
                'tournament_id' => $tournament->id,
                'name' => $validated['division_name'],
                'skill_level' => $validated['division_skill_level'] ?? null,
                'match_type' => $validated['division_match_type'],
                'gender_policy' => $validated['division_gender_policy'],
                'max_teams' => $validated['division_max_teams'] ?? null,
                'status' => $validated['status'] === 'draft' ? 'draft' : 'open',
            ]);

            return back()->with('success', 'CourtPrime tournament created.');
        });
    }

    private function slug(int $organizationId, string $name): string
    {
        $base = Str::slug($name) ?: 'tournament';

        for ($attempt = 0; $attempt < 20; $attempt++) {
            $slug = $attempt === 0 ? $base : "{$base}-{$attempt}";

            if (! Tournament::query()->withoutGlobalScope('organization')->where('organization_id', $organizationId)->where('slug', $slug)->exists()) {
                return $slug;
            }
        }

        throw ValidationException::withMessages(['name' => 'Choose a more unique tournament name.']);
    }
}
