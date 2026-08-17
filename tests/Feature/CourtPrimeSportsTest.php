<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\ClubMatch;
use App\Models\Court;
use App\Models\OpenPlayQueueEntry;
use App\Models\OpenPlaySession;
use App\Models\Organization;
use App\Models\Player;
use App\Models\ScoreEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourtPrimeSportsTest extends TestCase
{
    use RefreshDatabase;

    public function test_scorekeeper_records_score_events_and_can_undo(): void
    {
        [$organization, $branch, $court, $user] = $this->fixture();
        $match = ClubMatch::query()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'court_id' => $court->id,
            'match_type' => 'doubles',
            'format' => 'first_to_11_win_by_2',
            'target_score' => 11,
            'win_by_two' => true,
            'scoring_mode' => 'side_out',
            'team_one_name' => 'Santos / Cruz',
            'team_two_name' => 'Reyes / Lim',
            'team_one_score' => 0,
            'team_two_score' => 0,
            'status' => 'live',
            'started_at' => now(),
        ]);

        $this->actingAs($user)->post(route('matches.score', $match, absolute: false), ['team' => 'team_one'])->assertRedirect();

        $this->assertSame(1, $match->refresh()->team_one_score);
        $this->assertTrue(ScoreEvent::query()->where('club_match_id', $match->id)->where('event_type', 'score_increment')->exists());

        $this->actingAs($user)->post(route('matches.undo', $match, absolute: false))->assertRedirect();

        $this->assertSame(0, $match->refresh()->team_one_score);
        $this->assertTrue(ScoreEvent::query()->where('club_match_id', $match->id)->where('event_type', 'undo')->exists());
    }

    public function test_match_completes_at_target_score_with_win_by_two(): void
    {
        [$organization, $branch, $court, $user] = $this->fixture();
        $match = ClubMatch::query()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'court_id' => $court->id,
            'match_type' => 'singles',
            'format' => 'first_to_11_win_by_2',
            'target_score' => 11,
            'win_by_two' => true,
            'scoring_mode' => 'side_out',
            'team_one_name' => 'Juan Santos',
            'team_two_name' => 'Carlo Reyes',
            'team_one_score' => 10,
            'team_two_score' => 8,
            'status' => 'live',
        ]);

        $this->actingAs($user)->post(route('matches.score', $match, absolute: false), ['team' => 'team_one'])->assertRedirect();

        $this->assertSame('completed', $match->refresh()->status);
        $this->assertSame(11, $match->team_one_score);
    }

    public function test_open_play_join_adds_player_to_queue(): void
    {
        [$organization, $branch, $court, $user] = $this->fixture();
        $player = Player::query()->create([
            'organization_id' => $organization->id,
            'name' => 'Anne Lim',
            'email' => 'anne@example.test',
            'rating' => 3.5,
            'skill_level' => 'intermediate',
            'membership_status' => 'active',
        ]);
        $session = OpenPlaySession::query()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'name' => 'Saturday Open Play',
            'session_date' => today(),
            'start_time' => '19:00',
            'end_time' => '22:00',
            'max_players' => 32,
            'entry_fee' => 200,
        ]);

        $this->actingAs($user)->post(route('open-play.join', [$session, $player], absolute: false))->assertRedirect();

        $this->assertTrue(OpenPlayQueueEntry::query()->where('open_play_session_id', $session->id)->where('player_id', $player->id)->exists());
    }

    private function fixture(): array
    {
        $organization = Organization::query()->create(['name' => 'EAJ Club', 'slug' => 'eaj-club']);
        $branch = Branch::query()->create(['organization_id' => $organization->id, 'name' => 'Bacolod', 'code' => 'BAC']);
        $court = Court::query()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'name' => 'Court 1',
            'court_number' => 1,
            'standard_hourly_rate' => 600,
            'status' => 'available',
        ]);
        $user = User::factory()->create(['organization_id' => $organization->id, 'branch_id' => $branch->id, 'role_key' => 'scorekeeper']);

        return [$organization, $branch, $court, $user];
    }
}
