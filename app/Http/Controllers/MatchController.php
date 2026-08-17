<?php

namespace App\Http\Controllers;

use App\Http\Requests\MatchStoreRequest;
use App\Models\ClubMatch;
use App\Models\Court;
use Inertia\Inertia;
use Inertia\Response;

class MatchController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', ClubMatch::class);

        return Inertia::render('matches', [
            'matches' => ClubMatch::query()
                ->with(['court.branch', 'games'])
                ->latest()
                ->paginate(15),
            'courts' => Court::query()->with('branch')->orderBy('branch_id')->orderBy('court_number')->get(),
        ]);
    }

    public function store(MatchStoreRequest $request)
    {
        $this->authorize('create', ClubMatch::class);

        $court = Court::query()->with('branch')->findOrFail($request->integer('court_id'));

        ClubMatch::query()->create([
            ...$request->validated(),
            'organization_id' => $court->organization_id,
            'branch_id' => $court->branch_id,
            'team_one_score' => 0,
            'team_two_score' => 0,
            'game_number' => 1,
            'status' => 'live',
            'started_at' => now(),
            'scorekeeper_id' => $request->user()->id,
        ]);

        $court->update(['status' => 'occupied']);

        return back()->with('success', 'Match started.');
    }
}
