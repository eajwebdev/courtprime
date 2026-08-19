<?php

namespace App\Http\Controllers;

use App\Events\MatchScoreUpdated;
use App\Http\Requests\MatchDisputeStoreRequest;
use App\Models\ClubMatch;
use App\Models\MatchDispute;
use App\Services\MatchScoringService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScoreController extends Controller
{
    public function show(ClubMatch $match): Response
    {
        $this->authorize('view', $match);

        return Inertia::render('scorekeeper', [
            'match' => $match->load([
                'court.branch',
                'scoreEvents' => fn ($query) => $query->latest()->limit(20),
                'games',
                'disputes' => fn ($query) => $query->with('reporter:id,name')->latest(),
            ]),
        ]);
    }

    public function score(Request $request, ClubMatch $match, MatchScoringService $scoring)
    {
        $this->authorize('update', $match);

        $request->validate(['team' => ['required', 'in:team_one,team_two']]);
        $updated = $scoring->increment($match, $request->string('team')->toString(), $request->user()->id);
        event(new MatchScoreUpdated($updated));

        return back()->with('success', 'Score updated.');
    }

    public function undo(Request $request, ClubMatch $match, MatchScoringService $scoring)
    {
        $this->authorize('update', $match);

        $updated = $scoring->undo($match, $request->user()->id);
        event(new MatchScoreUpdated($updated));

        return back()->with('success', 'Score undone.');
    }

    public function verify(Request $request, ClubMatch $match): RedirectResponse
    {
        $this->authorize('update', $match);

        if ($match->status !== 'completed') {
            return back()->withErrors(['match' => 'Only completed matches can be verified.']);
        }

        $match->update([
            'verification_status' => 'verified',
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);
        event(new MatchScoreUpdated($match->refresh()));

        MatchDispute::query()
            ->where('club_match_id', $match->id)
            ->where('status', 'open')
            ->update([
                'status' => 'resolved',
                'resolved_by' => $request->user()->id,
                'resolved_at' => now(),
            ]);

        return back()->with('success', 'CourtPrime match verified.');
    }

    public function dispute(MatchDisputeStoreRequest $request, ClubMatch $match): RedirectResponse
    {
        $this->authorize('view', $match);

        $validated = $request->validated();

        MatchDispute::query()->create([
            'organization_id' => $match->organization_id,
            'club_match_id' => $match->id,
            'reported_by' => $request->user()->id,
            'reason' => $validated['reason'],
            'description' => $validated['description'],
            'status' => 'open',
        ]);

        $match->update(['verification_status' => 'disputed']);
        event(new MatchScoreUpdated($match->refresh()));

        return back()->with('success', 'CourtPrime match dispute submitted.');
    }
}
