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
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The club-wide wall board at /display/live.
 *
 * It is reachable without signing in, so the two things worth pinning are what
 * it shows a stranger and whose courts those are: a board that wears one club's
 * branding must not be listing another club's games underneath it.
 */
class LiveDisplayTest extends TestCase
{
    use RefreshDatabase;

    private function club(string $name, string $slug): array
    {
        $organization = Organization::query()->create([
            'name' => $name,
            'slug' => $slug,
            'status' => 'active',
            'timezone' => 'Asia/Manila',
            'currency' => 'PHP',
        ]);

        $branch = Branch::query()->create([
            'organization_id' => $organization->id,
            'name' => $name.' Main',
            'code' => strtoupper($slug).'-MAIN',
            'status' => 'active',
        ]);

        $court = Court::query()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'name' => $name.' Court 1',
            'court_number' => 1,
            'status' => 'available',
            'standard_hourly_rate' => 500,
        ]);

        return [$organization, $branch, $court];
    }

    private function liveMatch(Organization $organization, Branch $branch, Court $court, string $label): ClubMatch
    {
        return ClubMatch::query()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'court_id' => $court->id,
            'match_type' => 'doubles',
            'team_one_name' => $label.' A',
            'team_two_name' => $label.' B',
            'team_one_score' => 5,
            'team_two_score' => 3,
            'status' => 'live',
            'started_at' => now(),
        ]);
    }

    public function test_a_stranger_cannot_pull_the_whole_network_from_the_club_board(): void
    {
        [$one, $oneBranch, $oneCourt] = $this->club('Alpha Club', 'alpha-club');
        [$two, $twoBranch, $twoCourt] = $this->club('Beta Club', 'beta-club');

        $this->liveMatch($one, $oneBranch, $oneCourt, 'Alpha');
        $this->liveMatch($two, $twoBranch, $twoCourt, 'Beta');

        /* No branch, nobody signed in: there is no honest board to draw, and
           the old behaviour was to hand over every club at once. */
        $this->get('/display/live')->assertNotFound();
    }

    public function test_a_venue_board_shows_only_that_venue_club(): void
    {
        [$one, $oneBranch, $oneCourt] = $this->club('Alpha Club', 'alpha-club');
        [$two, $twoBranch, $twoCourt] = $this->club('Beta Club', 'beta-club');

        $this->liveMatch($one, $oneBranch, $oneCourt, 'Alpha');
        $this->liveMatch($two, $twoBranch, $twoCourt, 'Beta');

        $response = $this->get('/display/live?branch='.$oneBranch->id);

        $response->assertOk();

        $courts = collect($response->viewData('page')['props']['courts']);

        $this->assertCount(1, $courts);
        $this->assertSame('Alpha Club Court 1', $courts->first()['name']);
        $this->assertSame('Alpha A', $courts->first()['match']['team_one_name']);

        /* Nothing of the other club reaches the page at all. */
        $this->assertStringNotContainsString('Beta', json_encode($courts->all()));
    }

    public function test_a_club_can_put_the_board_behind_a_token(): void
    {
        [$organization, $branch] = $this->club('Alpha Club', 'alpha-club');

        $organization->update(['settings' => [
            'live_display_token_required' => true,
            'live_display_token_hash' => hash('sha256', 'letmein'),
        ]]);

        $this->get('/display/live?branch='.$branch->id)->assertForbidden();
        $this->get('/display/live?branch='.$branch->id.'&token=letmein')->assertOk();
    }

    public function test_the_board_carries_the_players_on_court_with_their_portraits(): void
    {
        [$organization, $branch, $court] = $this->club('Alpha Club', 'alpha-club');
        $clubMatch = $this->liveMatch($organization, $branch, $court, 'Alpha');

        $player = Player::query()->create([
            'organization_id' => $organization->id,
            'name' => 'Marco Santos',
            'rating' => 3.5,
            'skill_level' => 'intermediate',
        ]);

        $profile = PlayerProfile::query()->create([
            'courtprime_player_id' => 'CP-TEST-1',
            'display_name' => 'Marco Santos',
            'gender' => 'male',
            'skill_level' => 'intermediate',
            'status' => 'active',
        ]);

        OrganizationPlayer::query()->create([
            'organization_id' => $organization->id,
            'player_profile_id' => $profile->id,
            'legacy_player_id' => $player->id,
            'status' => 'active',
        ]);

        $session = OpenPlaySession::query()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'name' => 'Tonight',
            'session_code' => 'OP-DISP',
            'session_key' => 'KEY123',
            'session_date' => today(),
            'start_time' => '18:00',
            'end_time' => '22:00',
            'status' => 'live',
        ]);

        $openPlayMatch = OpenPlayMatch::query()->create([
            'organization_id' => $organization->id,
            'open_play_session_id' => $session->id,
            'club_match_id' => $clubMatch->id,
            'court_id' => $court->id,
            'round' => 1,
            'status' => 'live',
        ]);

        OpenPlayMatchPlayer::query()->create([
            'organization_id' => $organization->id,
            'open_play_match_id' => $openPlayMatch->id,
            'player_id' => $player->id,
            'team' => 'one',
        ]);

        $response = $this->get('/display/live?branch='.$branch->id);

        $response->assertOk();

        $match = collect($response->viewData('page')['props']['courts'])->first()['match'];
        $onCourt = $match['team_one'][0];

        /* First name and initial, so the board can set one large and one small,
           and the stated gender that picks which stand-in artwork is used. */
        $this->assertSame('Marco', $onCourt['first_name']);
        $this->assertSame('S.', $onCourt['last_initial']);
        $this->assertSame('male', $onCourt['gender']);
        $this->assertSame([], $onCourt['photos']);

        /* A screen strangers walk past learns nothing else about them. */
        $this->assertEqualsCanonicalizing(
            ['id', 'first_name', 'last_initial', 'rating', 'skill_level', 'gender', 'photos'],
            array_keys($onCourt),
        );
    }

    public function test_a_signed_in_club_user_gets_their_own_club_without_naming_a_branch(): void
    {
        [$one, $oneBranch, $oneCourt] = $this->club('Alpha Club', 'alpha-club');
        [$two, $twoBranch, $twoCourt] = $this->club('Beta Club', 'beta-club');

        $this->liveMatch($one, $oneBranch, $oneCourt, 'Alpha');
        $this->liveMatch($two, $twoBranch, $twoCourt, 'Beta');

        $user = User::query()->create([
            'organization_id' => $one->id,
            'branch_id' => $oneBranch->id,
            'name' => 'Club Owner',
            'email' => 'owner@alpha.test',
            'password' => bcrypt('password'),
            'platform_role' => 'organization_owner',
        ]);

        $response = $this->actingAs($user)->get('/display/live');

        $response->assertOk();

        $courts = collect($response->viewData('page')['props']['courts']);

        $this->assertCount(1, $courts);
        $this->assertSame('Alpha Club Court 1', $courts->first()['name']);
    }
}
