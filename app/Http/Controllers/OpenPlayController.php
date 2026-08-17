<?php

namespace App\Http\Controllers;

use App\Http\Requests\OpenPlayGroupStoreRequest;
use App\Http\Requests\OpenPlaySessionStoreRequest;
use App\Models\Branch;
use App\Models\Court;
use App\Models\OpenPlaySession;
use App\Models\Player;
use App\Services\OpenPlayService;
use App\Services\SubscriptionFeatureGate;
use App\Services\TenantContext;
use Inertia\Inertia;
use Inertia\Response;

class OpenPlayController extends Controller
{
    public function index(OpenPlayService $openPlay, TenantContext $tenantContext, SubscriptionFeatureGate $subscriptionGate): Response
    {
        $this->authorize('viewAny', OpenPlaySession::class);
        $subscriptionGate->ensureAnyFeatureEnabled($tenantContext->currentOrganization(), ['open_play'], 'Open Play');

        $session = OpenPlaySession::query()->with(['branch.courts', 'players.player', 'queue.player', 'queue.court'])->latest()->first();

        return Inertia::render('open-play', [
            'sessions' => OpenPlaySession::query()->withCount(['players', 'queue'])->with('branch')->latest()->paginate(10),
            'activeSession' => $session,
            'recommendedGroups' => $session ? [
                'queue_priority' => $openPlay->recommendGroup($session, mode: 'queue_priority'),
                'skill_based' => $openPlay->recommendGroup($session, mode: 'skill_based'),
                'random' => $openPlay->recommendGroup($session, mode: 'random'),
                'winner_stays' => $openPlay->recommendGroup($session, mode: 'winner_stays'),
            ] : [],
            'recommendedGroup' => $session ? $openPlay->recommendGroup($session, mode: 'skill_based') : [],
            'branches' => Branch::query()->orderBy('name')->get(),
            'players' => Player::query()->orderByDesc('rating')->get(),
        ]);
    }

    public function store(OpenPlaySessionStoreRequest $request, TenantContext $tenantContext, SubscriptionFeatureGate $subscriptionGate)
    {
        $this->authorize('create', OpenPlaySession::class);
        $subscriptionGate->ensureAnyFeatureEnabled($tenantContext->currentOrganization(), ['open_play'], 'Open Play');

        $branch = Branch::query()->findOrFail($request->integer('branch_id'));

        OpenPlaySession::query()->create([
            ...$request->validated(),
            'organization_id' => $branch->organization_id,
            'status' => 'scheduled',
        ]);

        return back()->with('success', 'Open play session created.');
    }

    public function join(OpenPlaySession $session, Player $player, OpenPlayService $openPlay)
    {
        $this->authorize('update', $session);
        $this->authorize('view', $player);

        $openPlay->join($session, $player);

        return back()->with('success', 'Player added to queue.');
    }

    public function checkIn(OpenPlaySession $session, Player $player, OpenPlayService $openPlay)
    {
        $this->authorize('update', $session);
        $this->authorize('view', $player);

        $openPlay->checkIn($session, $player);

        return back()->with('success', 'Open play player checked in.');
    }

    public function group(OpenPlayGroupStoreRequest $request, OpenPlaySession $session, OpenPlayService $openPlay)
    {
        $this->authorize('update', $session);

        $validated = $request->validated();

        if (! empty($validated['court_id'])) {
            $courtBelongsToSessionBranch = Court::query()
                ->withoutGlobalScope('organization')
                ->whereKey($validated['court_id'])
                ->where('branch_id', $session->branch_id)
                ->where('organization_id', $session->organization_id)
                ->exists();

            abort_unless($courtBelongsToSessionBranch, 403);
        }

        $openPlay->buildGroup(
            $session,
            (int) $validated['group_size'],
            $validated['mode'],
            $validated['court_id'] ?? null,
            $validated['player_ids'] ?? [],
        );

        return back()->with('success', 'Open play group called to court.');
    }
}
