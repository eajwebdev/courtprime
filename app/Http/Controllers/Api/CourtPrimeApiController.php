<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClubMatch;
use App\Models\Court;
use App\Models\OrganizationPlayer;
use App\Models\PlayerRanking;
use App\Models\Reservation;
use App\Models\Tournament;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourtPrimeApiController extends Controller
{
    public function courts(Request $request): JsonResponse
    {
        return response()->json([
            'data' => Court::query()
                ->withoutGlobalScope('organization')
                ->with('branch:id,name,code,timezone,currency')
                ->where('organization_id', $this->organizationId($request))
                ->orderBy('branch_id')
                ->orderBy('court_number')
                ->get(['id', 'organization_id', 'branch_id', 'name', 'court_number', 'court_type', 'environment', 'surface_type', 'capacity', 'standard_hourly_rate', 'status']),
        ]);
    }

    public function reservations(Request $request): JsonResponse
    {
        return response()->json([
            'data' => Reservation::query()
                ->withoutGlobalScope('organization')
                ->with(['branch:id,name,code', 'court:id,name,court_number', 'player:id,name,email,mobile_number'])
                ->where('organization_id', $this->organizationId($request))
                ->when($request->query('branch_id'), fn ($query, $branchId) => $query->where('branch_id', $branchId))
                ->when($request->query('date'), fn ($query, $date) => $query->whereDate('reservation_date', $date))
                ->latest()
                ->limit(100)
                ->get(['id', 'organization_id', 'branch_id', 'court_id', 'player_id', 'reference', 'reservation_date', 'start_time', 'end_time', 'players_count', 'reservation_type', 'amount_due', 'payment_status', 'booking_status', 'source']),
        ]);
    }

    public function scores(Request $request): JsonResponse
    {
        return response()->json([
            'data' => ClubMatch::query()
                ->withoutGlobalScope('organization')
                ->with(['branch:id,name,code', 'court:id,name,court_number', 'games:id,club_match_id,game_number,team_one_score,team_two_score,winner_team'])
                ->where('organization_id', $this->organizationId($request))
                ->when($request->query('status'), fn ($query, $status) => $query->where('status', $status))
                ->latest()
                ->limit(100)
                ->get(['id', 'organization_id', 'branch_id', 'court_id', 'match_type', 'format', 'team_one_name', 'team_two_name', 'team_one_score', 'team_two_score', 'serving_team', 'game_number', 'status', 'verification_status', 'started_at', 'ended_at']),
        ]);
    }

    public function tournaments(Request $request): JsonResponse
    {
        return response()->json([
            'data' => Tournament::query()
                ->withoutGlobalScope('organization')
                ->with('branch:id,name,code')
                ->withCount(['divisions', 'registrations'])
                ->where('organization_id', $this->organizationId($request))
                ->when($request->query('status'), fn ($query, $status) => $query->where('status', $status))
                ->latest('starts_on')
                ->limit(100)
                ->get(['id', 'organization_id', 'branch_id', 'name', 'slug', 'starts_on', 'ends_on', 'format', 'visibility', 'max_players', 'entry_fee', 'status']),
        ]);
    }

    public function players(Request $request): JsonResponse
    {
        return response()->json([
            'data' => OrganizationPlayer::query()
                ->withoutGlobalScope('organization')
                ->with('playerProfile:id,courtprime_player_id,display_name,home_city,skill_level,global_rating,global_match_count,wins,losses,verification_status,status')
                ->where('organization_id', $this->organizationId($request))
                ->when($request->query('status'), fn ($query, $status) => $query->where('status', $status))
                ->latest('last_visit_at')
                ->limit(100)
                ->get(['id', 'organization_id', 'home_branch_id', 'player_profile_id', 'local_player_number', 'organization_skill_level', 'customer_status', 'first_visit_at', 'last_visit_at', 'status']),
        ]);
    }

    public function rankings(Request $request): JsonResponse
    {
        return response()->json([
            'data' => PlayerRanking::query()
                ->withoutGlobalScope('organization')
                ->with('player:id,name,email')
                ->where('organization_id', $this->organizationId($request))
                ->when($request->query('division'), fn ($query, $division) => $query->where('division', $division))
                ->orderBy('rank')
                ->limit(100)
                ->get(['id', 'organization_id', 'player_id', 'division', 'rank', 'rating', 'wins', 'losses', 'points_for', 'points_against', 'ranked_at']),
        ]);
    }

    private function organizationId(Request $request): int
    {
        return (int) $request->attributes->get('courtprime_organization_id');
    }
}
