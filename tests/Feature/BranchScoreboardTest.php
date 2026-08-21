<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\ClubMatch;
use App\Models\Court;
use App\Models\OpenPlayMatch;
use App\Models\OpenPlayMatchPlayer;
use App\Models\OpenPlaySession;
use App\Models\Organization;
use App\Models\OrganizationPlayer;
use App\Models\Player;
use App\Models\PlayerProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The courtside screen for one branch.
 *
 * It hangs on a wall in a venue nobody signs into, so it is public — and what a
 * public screen may say about the people on court is the thing these pin down.
 */
class BranchScoreboardTest extends TestCase
{
    use RefreshDatabase;

    private Organization $organization;

    private Branch $branch;

    private function makeVenue(array $settings = []): Branch
    {
        $this->organization = Organization::query()->create([
            'name' => 'Scoreboard Club',
            'slug' => 'scoreboard-club',
            'status' => 'active',
            'timezone' => 'Asia/Manila',
            'currency' => 'PHP',
            'settings' => $settings,
        ]);

        return $this->branch = Branch::query()->create([
            'organization_id' => $this->organization->id,
            'name' => 'Main Venue',
            'code' => 'SC-MAIN',
            'status' => 'active',
        ]);
    }

    private function makeCourt(int $number = 1): Court
    {
        return Court::query()->create([
            'organization_id' => $this->organization->id,
            'branch_id' => $this->branch->id,
            'name' => 'Court '.$number,
            'court_number' => $number,
            'status' => 'available',
            'standard_hourly_rate' => 500,
        ]);
    }

    /** A player on the network, joined to this club, optionally with photos. */
    private function makePlayer(string $name, string $gender, array $photos = []): Player
    {
        $player = Player::query()->create([
            'organization_id' => $this->organization->id,
            'name' => $name,
            'rating' => 4.10,
            'skill_level' => 'advanced',
        ]);

        $profile = PlayerProfile::query()->create([
            'courtprime_player_id' => 'CP-PLY-'.str_pad((string) $player->id, 6, '0', STR_PAD_LEFT),
            'display_name' => $name,
            'gender' => $gender,
            'status' => 'active',
            ...$photos,
        ]);

        OrganizationPlayer::query()->withoutGlobalScope('organization')->create([
            'organization_id' => $this->organization->id,
            'player_profile_id' => $profile->id,
            'legacy_player_id' => $player->id,
            'local_player_number' => 'SB-'.$player->id,
            'status' => 'active',
        ]);

        return $player;
    }

    /** A live match on a court, with the rotation behind it naming the players. */
    private function playLive(Court $court, array $teamOne, array $teamTwo): ClubMatch
    {
        $match = ClubMatch::query()->create([
            'organization_id' => $this->organization->id,
            'branch_id' => $this->branch->id,
            'court_id' => $court->id,
            'team_one_name' => 'Team A',
            'team_two_name' => 'Team B',
            'team_one_score' => 8,
            'team_two_score' => 6,
            'serving_team' => 'team_one',
            'game_number' => 1,
            'status' => 'live',
            'started_at' => now()->subMinutes(12),
        ]);

        $session = OpenPlaySession::query()->create([
            'organization_id' => $this->organization->id,
            'branch_id' => $this->branch->id,
            'name' => 'Tonight',
            'session_code' => 'OP-SB'.$court->id,
            'session_key' => '1234',
            'session_date' => today(),
            'start_time' => '18:00',
            'end_time' => '22:00',
            'status' => 'live',
        ]);

        $openPlayMatch = OpenPlayMatch::query()->create([
            'organization_id' => $this->organization->id,
            'open_play_session_id' => $session->id,
            'club_match_id' => $match->id,
            'court_id' => $court->id,
            'round' => 1,
            'status' => 'live',
        ]);

        foreach ([['one', $teamOne], ['two', $teamTwo]] as [$team, $players]) {
            foreach ($players as $player) {
                OpenPlayMatchPlayer::query()->create([
                    'organization_id' => $this->organization->id,
                    'open_play_match_id' => $openPlayMatch->id,
                    'player_id' => $player->id,
                    'team' => $team,
                ]);
            }
        }

        return $match;
    }

    public function test_the_board_shows_who_is_on_court_and_the_score(): void
    {
        $this->makeVenue();
        $court = $this->makeCourt();

        $maria = $this->makePlayer('Maria Cruz', 'female');
        $juan = $this->makePlayer('Juan Santos', 'male');

        $this->playLive($court, [$maria], [$juan]);

        $this->get("/display/scoreboard/{$this->branch->id}")
            ->assertOk()
            ->assertInertia(function ($page) {
                $page->component('branch-scoreboard')
                    ->where('courts.0.match.team_one_score', 8)
                    ->where('courts.0.match.team_two_score', 6)
                    ->where('courts.0.match.serving_team', 'team_one')
                    ->where('courts.0.match.serving_number', 2)
                    ->where('courts.0.match.serve_call', '8-6-2')
                    /* First name large, initial beside it — never the surname. */
                    ->where('courts.0.match.team_one.0.first_name', 'Maria')
                    ->where('courts.0.match.team_one.0.last_initial', 'C.')
                    ->where('courts.0.match.team_two.0.first_name', 'Juan')
                    ->where('courts.0.match.team_two.0.last_initial', 'S.');
            });
    }

    public function test_a_public_screen_never_carries_a_surname_or_contact_detail(): void
    {
        $this->makeVenue();
        $court = $this->makeCourt();

        $maria = $this->makePlayer('Maria Cruz', 'female');
        $maria->update(['email' => 'maria@example.test', 'mobile_number' => '+63 900 000 0000']);

        $this->playLive($court, [$maria], []);

        $response = $this->get("/display/scoreboard/{$this->branch->id}")->assertOk();

        $response->assertDontSee('Cruz');
        $response->assertDontSee('maria@example.test');
        $response->assertDontSee('+63 900 000 0000');
    }

    /**
     * The board falls back to the CourtPrime stand-ins by handing the page an
     * empty photo list; the gender it also hands over is what picks the set.
     */
    public function test_a_player_without_photos_comes_back_with_none_and_their_stated_gender(): void
    {
        $this->makeVenue();
        $court = $this->makeCourt();

        $player = $this->makePlayer('Sofia Garcia', 'female');
        $this->playLive($court, [$player], []);

        $this->get("/display/scoreboard/{$this->branch->id}")->assertInertia(
            fn ($page) => $page->where('courts.0.match.team_one.0.photos', [])
                ->where('courts.0.match.team_one.0.gender', 'female'),
        );
    }

    public function test_a_player_with_photos_gets_their_own(): void
    {
        $this->makeVenue();
        $court = $this->makeCourt();

        $player = $this->makePlayer('Miguel Tan', 'male', [
            'avatar_path' => 'player-avatars/one.png',
            'action_photo_path' => 'player-action-photos/two.png',
            'action_photo_three_path' => 'player-action-photos/four.png',
        ]);

        $this->playLive($court, [$player], []);

        $this->get("/display/scoreboard/{$this->branch->id}")->assertInertia(function ($page) {
            /* Three uploads, gaps closed up, avatar first. */
            $photos = $page->toArray()['props']['courts'][0]['match']['team_one'][0]['photos'];

            $this->assertCount(3, $photos);
            $this->assertStringContainsString('one.png', $photos[0]);
            $this->assertStringContainsString('two.png', $photos[1]);
            $this->assertStringContainsString('four.png', $photos[2]);
        });
    }

    public function test_a_board_only_shows_its_own_branch(): void
    {
        $this->makeVenue();
        $mine = $this->makeCourt(1);

        $otherBranch = Branch::query()->create([
            'organization_id' => $this->organization->id,
            'name' => 'Other Venue',
            'code' => 'SC-OTHER',
            'status' => 'active',
        ]);

        Court::query()->create([
            'organization_id' => $this->organization->id,
            'branch_id' => $otherBranch->id,
            'name' => 'Faraway Court',
            'court_number' => 1,
            'status' => 'available',
            'standard_hourly_rate' => 500,
        ]);

        $this->get("/display/scoreboard/{$this->branch->id}")
            ->assertOk()
            ->assertSee($mine->name)
            ->assertDontSee('Faraway Court');
    }

    public function test_a_club_can_put_its_screens_behind_a_token(): void
    {
        $this->makeVenue([
            'live_display_token_required' => true,
            'live_display_token_hash' => hash('sha256', 'wall-screen'),
        ]);
        $this->makeCourt();

        $this->get("/display/scoreboard/{$this->branch->id}")->assertForbidden();
        $this->get("/display/scoreboard/{$this->branch->id}?token=wrong")->assertForbidden();
        $this->get("/display/scoreboard/{$this->branch->id}?token=wall-screen")->assertOk();
    }

    public function test_a_match_scored_by_hand_still_shows_its_team_names(): void
    {
        $this->makeVenue();
        $court = $this->makeCourt();

        /* No open play rotation behind it, so there are no faces to draw. */
        ClubMatch::query()->create([
            'organization_id' => $this->organization->id,
            'branch_id' => $this->branch->id,
            'court_id' => $court->id,
            'team_one_name' => 'The Regulars',
            'team_two_name' => 'The Challengers',
            'team_one_score' => 3,
            'team_two_score' => 5,
            'game_number' => 1,
            'status' => 'live',
        ]);

        $this->get("/display/scoreboard/{$this->branch->id}")
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page->where('courts.0.match.team_one', [])
                    ->where('courts.0.match.team_one_name', 'The Regulars'),
            );
    }
}
