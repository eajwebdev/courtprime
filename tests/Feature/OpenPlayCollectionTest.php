<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\ClubMatch;
use App\Models\Court;
use App\Models\OpenPlayMatch;
use App\Models\OpenPlayMatchPlayer;
use App\Models\OpenPlayPlayer;
use App\Models\OpenPlaySession;
use App\Models\Organization;
use App\Models\Player;
use App\Services\OpenPlayCollectionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * What a session is owed.
 *
 * Entry is charged per player, once, and only once they have played. Going home
 * does not clear a charge that was already earned.
 */
class OpenPlayCollectionTest extends TestCase
{
    use RefreshDatabase;

    private OpenPlaySession $session;

    private Organization $organization;

    private Court $court;

    protected function setUp(): void
    {
        parent::setUp();

        $this->organization = Organization::query()->create([
            'name' => 'Money Club',
            'slug' => 'money-club',
            'owner_name' => 'Owner',
            'email' => 'ops@money-club.test',
            'status' => 'active',
            'timezone' => 'Asia/Manila',
            'currency' => 'PHP',
        ]);

        $branch = Branch::query()->create([
            'organization_id' => $this->organization->id,
            'name' => 'Main',
            'code' => 'MC-MAIN',
            'address' => 'Somewhere',
            'status' => 'active',
        ]);

        $this->court = Court::query()->create([
            'organization_id' => $this->organization->id,
            'branch_id' => $branch->id,
            'name' => 'Court 1',
            'court_number' => 1,
            'status' => 'available',
            'standard_hourly_rate' => 500,
        ]);

        $this->session = OpenPlaySession::query()->create([
            'organization_id' => $this->organization->id,
            'branch_id' => $branch->id,
            'name' => 'Money Session',
            'session_code' => 'OP-MONEY1',
            'session_key' => '1234',
            'session_date' => today(),
            'start_time' => '18:00',
            'end_time' => '21:00',
            'status' => 'live',
            'entry_fee' => 200,
            'current_round' => 1,
            'auto_rotate' => true,
        ]);
    }

    private function addPlayer(string $name): Player
    {
        $player = Player::query()->create([
            'organization_id' => $this->organization->id,
            'name' => $name,
            'rating' => 3,
            'skill_level' => 'intermediate',
        ]);

        OpenPlayPlayer::query()->create([
            'organization_id' => $this->organization->id,
            'open_play_session_id' => $this->session->id,
            'player_id' => $player->id,
            'status' => 'checked_in',
            'checked_in_at' => now(),
        ]);

        return $player;
    }

    /** A completed match with the given players on it. */
    private function playMatch(array $players): void
    {
        $clubMatch = ClubMatch::query()->create([
            'organization_id' => $this->organization->id,
            'branch_id' => $this->court->branch_id,
            'court_id' => $this->court->id,
            'match_type' => 'doubles',
            'team_one_name' => 'One',
            'team_two_name' => 'Two',
            'status' => 'completed',
            'started_at' => now(),
        ]);

        $match = OpenPlayMatch::query()->create([
            'organization_id' => $this->organization->id,
            'open_play_session_id' => $this->session->id,
            'club_match_id' => $clubMatch->id,
            'court_id' => $this->court->id,
            'round' => 1,
            'status' => 'completed',
            'winner_team' => 'one',
        ]);

        foreach ($players as $index => $player) {
            OpenPlayMatchPlayer::query()->create([
                'organization_id' => $this->organization->id,
                'open_play_match_id' => $match->id,
                'player_id' => $player->id,
                'team' => $index < 2 ? 'one' : 'two',
            ]);
        }
    }

    /**
     * Checking in is what is charged for.
     *
     * The sheet used to wait for a completed game before it would bill anyone,
     * so a hall full of people waiting on two courts read as nothing owed and
     * the desk had to chase them afterwards.
     */
    public function test_a_player_who_has_not_played_yet_still_owes_the_entry(): void
    {
        $waited = $this->addPlayer('Never Played');

        $sheet = app(OpenPlayCollectionService::class)->sheet($this->session);
        $row = collect($sheet['players'])->firstWhere('player_id', $waited->id);

        $this->assertSame(0, $row['games'], 'They have not played.');
        $this->assertEqualsWithDelta(200, $row['due'], 0.01, 'Being in the session is what the fee is for.');
        $this->assertEqualsWithDelta(200, $sheet['due'], 0.01);
        $this->assertSame(1, $sheet['billable']);
    }

    public function test_one_game_owes_the_full_entry(): void
    {
        $players = collect(['A', 'B', 'C', 'D'])->map(fn ($name) => $this->addPlayer($name));
        $this->playMatch($players->all());

        $sheet = app(OpenPlayCollectionService::class)->sheet($this->session);

        $this->assertEqualsWithDelta(800, $sheet['due'], 0.01, 'Four players at 200 each.');
        $this->assertSame(4, $sheet['billable']);
    }

    public function test_a_player_who_played_still_owes_after_being_removed(): void
    {
        $players = collect(['A', 'B', 'C', 'D'])->map(fn ($name) => $this->addPlayer($name));
        $this->playMatch($players->all());

        $collections = app(OpenPlayCollectionService::class);
        $outcome = $collections->removePlayer($this->session, $players[0]->id);

        $this->assertSame('left', $outcome);

        $sheet = $collections->sheet($this->session);
        $row = collect($sheet['players'])->firstWhere('player_id', $players[0]->id);

        $this->assertNotNull($row, 'A player who played stays on the sheet after leaving.');
        $this->assertTrue($row['left']);
        $this->assertEqualsWithDelta(200, $row['due'], 0.01);
        $this->assertEqualsWithDelta(800, $sheet['due'], 0.01, 'Leaving does not reduce what the club is owed.');
    }

    /**
     * Removing somebody who never played and never paid is the desk fixing a
     * mistyped name, not a debt being written off.
     */
    public function test_a_player_with_no_games_and_no_money_is_deleted_on_removal(): void
    {
        $waited = $this->addPlayer('Never Played');

        $collections = app(OpenPlayCollectionService::class);
        $outcome = $collections->removePlayer($this->session, $waited->id);

        $this->assertSame('removed', $outcome);
        $this->assertSame(0, $this->session->players()->count(), 'Nothing happened, so nothing is remembered.');
    }

    /**
     * Paying on arrival and leaving before a court frees up is now an ordinary
     * night. Deleting that row would delete the money with it.
     */
    public function test_a_player_who_paid_survives_removal_even_with_no_games(): void
    {
        $paid = $this->addPlayer('Paid Then Left');

        $collections = app(OpenPlayCollectionService::class);
        $collections->settle($this->session, $paid->id);

        $outcome = $collections->removePlayer($this->session, $paid->id);

        $this->assertSame('left', $outcome);

        $sheet = $collections->sheet($this->session);
        $row = collect($sheet['players'])->firstWhere('player_id', $paid->id);

        $this->assertNotNull($row, 'The money they handed over is still on the sheet.');
        $this->assertTrue($row['settled']);
        $this->assertEqualsWithDelta(200, $sheet['collected'], 0.01);
    }

    public function test_the_session_board_cannot_take_payment(): void
    {
        /*
         * The board is opened with an ID and key handed out at the desk, so
         * anyone running a court could otherwise mark money as collected.
         * There is no route for it there at all.
         */
        $this->post('/open-play/board', ['code' => 'OP-MONEY1', 'key' => '1234'])->assertRedirect();

        $this->post('/open-play/OP-MONEY1/players/1/settle')->assertNotFound();
    }

    public function test_taking_payment_needs_a_signed_in_user(): void
    {
        $player = $this->addPlayer('A');

        $this->post("/open-play/{$this->session->id}/collect/{$player->id}")
            ->assertRedirect('/login');
    }

    public function test_settling_clears_what_is_outstanding(): void
    {
        $players = collect(['A', 'B', 'C', 'D'])->map(fn ($name) => $this->addPlayer($name));
        $this->playMatch($players->all());

        $collections = app(OpenPlayCollectionService::class);
        $collections->settle($this->session, $players[0]->id);

        $sheet = $collections->sheet($this->session);
        $row = collect($sheet['players'])->firstWhere('player_id', $players[0]->id);

        $this->assertTrue($row['settled']);
        $this->assertEqualsWithDelta(200, $sheet['collected'], 0.01);
        $this->assertEqualsWithDelta(600, $sheet['outstanding'], 0.01);
    }
}
