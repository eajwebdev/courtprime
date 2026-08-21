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
                'serving_number' => $this->servingNumber($match),
                'serve_call' => $this->serveCall($match),
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

    private function servingTeam(ClubMatch $match): string
    {
        return in_array($match->serving_team, ['team_one', 'team_two'], true) ? $match->serving_team : 'team_one';
    }

    private function servingNumber(ClubMatch $match): ?int
    {
        if ($match->match_type === 'singles') {
            return null;
        }

        $number = (int) ($match->serving_number ?? 0);

        if (in_array($number, [1, 2], true)) {
            return $number;
        }

        return (int) $match->team_one_score === 0 && (int) $match->team_two_score === 0 && $this->servingTeam($match) === 'team_one' ? 2 : 1;
    }

    private function serveCall(ClubMatch $match): string
    {
        $servingTeam = $this->servingTeam($match);
        $serverScore = $servingTeam === 'team_one' ? (int) $match->team_one_score : (int) $match->team_two_score;
        $receiverScore = $servingTeam === 'team_one' ? (int) $match->team_two_score : (int) $match->team_one_score;
        $servingNumber = $this->servingNumber($match);

        return $servingNumber ? "{$serverScore}-{$receiverScore}-{$servingNumber}" : "{$serverScore}-{$receiverScore}";
    }
}
