<?php

namespace App\Http\Controllers;

use App\Models\ClubMatch;
use App\Models\MatchGame;
use App\Models\ScoreEvent;
use Inertia\Inertia;
use Inertia\Response;

class PublicLiveMatchController extends Controller
{
    public function show(ClubMatch $match): Response
    {
        abort_unless(in_array($match->status, ['live', 'completed'], true), 404);

        $match->load(['court.branch.organization']);

        return Inertia::render('public-live-match', [
            'match' => [
                'id' => $match->id,
                'match_type' => $match->match_type,
                'format' => $match->format,
                'target_score' => $match->target_score,
                'team_one_name' => $match->team_one_name,
                'team_two_name' => $match->team_two_name,
                'team_one_score' => $match->team_one_score,
                'team_two_score' => $match->team_two_score,
                'serving_team' => $match->serving_team,
                'game_number' => $match->game_number,
                'status' => $match->status,
                'verification_status' => $match->verification_status,
                'started_at' => $match->started_at?->toDateTimeString(),
                'ended_at' => $match->ended_at?->toDateTimeString(),
                'court' => [
                    'name' => $match->court?->name,
                    'branch' => $match->court?->branch?->name,
                    'organization' => $match->court?->branch?->organization?->name,
                ],
            ],
            'games' => MatchGame::query()
                ->withoutGlobalScope('organization')
                ->where('club_match_id', $match->id)
                ->orderBy('game_number')
                ->get(['id', 'game_number', 'team_one_score', 'team_two_score', 'winner_team', 'started_at', 'ended_at']),
            'events' => ScoreEvent::query()
                ->withoutGlobalScope('organization')
                ->where('club_match_id', $match->id)
                ->latest()
                ->limit(20)
                ->get(['id', 'event_type', 'team', 'team_one_score', 'team_two_score', 'created_at']),
        ]);
    }
}
