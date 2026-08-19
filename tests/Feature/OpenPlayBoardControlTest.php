<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Court;
use App\Models\OpenPlaySession;
use App\Models\OpenPlaySessionCourt;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * One device holds a board at a time.
 *
 * The session ID and key are the controls, so two tablets both adding players
 * and both recording results is the thing to prevent: that is how a rotation
 * ends up with two versions of who is next.
 */
class OpenPlayBoardControlTest extends TestCase
{
    use RefreshDatabase;

    private function makeSession(): OpenPlaySession
    {
        $organization = Organization::query()->create([
            'name' => 'Test Club',
            'slug' => 'test-club',
            'owner_name' => 'Owner',
            'email' => 'ops@test-club.test',
            'status' => 'active',
            'timezone' => 'Asia/Manila',
            'currency' => 'PHP',
        ]);

        $branch = Branch::query()->create([
            'organization_id' => $organization->id,
            'name' => 'Main',
            'code' => 'TC-MAIN',
            'address' => 'Somewhere',
            'status' => 'active',
        ]);

        $court = Court::query()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'name' => 'Court 1',
            'court_number' => 1,
            'status' => 'available',
            'standard_hourly_rate' => 500,
        ]);

        $session = OpenPlaySession::query()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'name' => 'Test Open Play',
            'session_code' => 'OP-TEST01',
            'session_key' => '1234',
            'session_date' => today(),
            'start_time' => '18:00',
            'end_time' => '21:00',
            'status' => 'open',
            'current_round' => 0,
            'auto_rotate' => true,
        ]);

        OpenPlaySessionCourt::query()->create([
            'organization_id' => $organization->id,
            'open_play_session_id' => $session->id,
            'court_id' => $court->id,
        ]);

        return $session;
    }

    public function test_a_second_device_cannot_open_a_board_someone_else_holds(): void
    {
        $this->makeSession();

        $first = $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234']);
        $first->assertRedirect('/open-play/OP-TEST01/board');

        /* A second browser: same pair, no shared session. */
        $this->flushSession();

        $second = $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234']);
        $second->assertSessionHasErrors('code');
    }

    public function test_the_board_can_be_taken_once_it_is_released(): void
    {
        $this->makeSession();

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();
        $this->post('/open-play/OP-TEST01/release')->assertRedirect('/open-play/board');

        $this->flushSession();

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])
            ->assertRedirect('/open-play/OP-TEST01/board');
    }

    public function test_a_device_that_is_not_holding_the_board_cannot_change_it(): void
    {
        $session = $this->makeSession();

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();
        $this->post('/open-play/OP-TEST01/players', ['name' => 'Marco Reyes'])->assertRedirect();

        $this->assertSame(1, $session->players()->count());

        /*
         * Take the board away from that browser, the way a second device would
         * once the first has gone quiet, and its controls stop working even
         * though it is still on the page.
         */
        $session->update([
            'organizer_token' => hash('sha256', 'someone-elses-token'),
            'organizer_claimed_at' => now(),
            'organizer_last_seen_at' => now(),
        ]);

        $this->post('/open-play/OP-TEST01/players', ['name' => 'Ana Cruz'])->assertForbidden();

        $this->assertSame(1, $session->players()->count());
    }

    public function test_an_actively_used_board_is_not_taken_over(): void
    {
        $session = $this->makeSession();

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();

        /*
         * Claimed a while ago but checking in now, which is any board that has
         * been running for more than the stale window. The heartbeat is what
         * separates this from a tablet that went flat.
         */
        $session->update([
            'organizer_claimed_at' => now()->subHours(2),
            'organizer_last_seen_at' => now(),
        ]);

        $this->flushSession();

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])
            ->assertSessionHasErrors('code');
    }

    public function test_a_board_that_has_gone_quiet_can_be_taken_over(): void
    {
        $session = $this->makeSession();

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();

        /* The tablet ran out of battery. Without this the session would be
           locked until somebody edited the database. */
        $session->update(['organizer_last_seen_at' => now()->subHour()]);

        $this->flushSession();

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])
            ->assertRedirect('/open-play/OP-TEST01/board');
    }

    public function test_the_winning_point_finishes_the_game_by_itself(): void
    {
        $session = $this->makeSession();
        $session->update(['target_score' => 11, 'win_by_two' => false]);

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();

        foreach (['A Player', 'B Player', 'C Player', 'D Player'] as $name) {
            $this->post('/open-play/OP-TEST01/players', ['name' => $name])->assertRedirect();
        }

        $this->post('/open-play/OP-TEST01/start')->assertRedirect();

        $match = $session->matches()->where('status', 'live')->firstOrFail();

        /*
         * Ten points is a live game; the eleventh wins it. Before this, the
         * eleventh completed the club match but left the open play match live,
         * so the court stayed on screen and the next tap was rejected.
         */
        for ($point = 1; $point <= 11; $point++) {
            $this->post("/open-play/OP-TEST01/matches/{$match->id}/score", ['team' => 'team_one'])->assertRedirect();
        }

        $match->refresh();

        $this->assertSame('completed', $match->status);
        $this->assertSame('one', $match->winner_team);
    }

    public function test_teams_cannot_be_rearranged_once_the_game_has_started(): void
    {
        $session = $this->makeSession();

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();

        foreach (['A Player', 'B Player', 'C Player', 'D Player'] as $name) {
            $this->post('/open-play/OP-TEST01/players', ['name' => $name])->assertRedirect();
        }

        $this->post('/open-play/OP-TEST01/start')->assertRedirect();

        $match = $session->matches()->where('status', 'live')->firstOrFail();
        $players = $match->participants()->pluck('player_id');

        $this->post("/open-play/OP-TEST01/matches/{$match->id}/score", ['team' => 'team_one'])->assertRedirect();

        /* Moving somebody across the net now would leave that point recorded
           against a team they were not on. */
        $this->post("/open-play/OP-TEST01/matches/{$match->id}/teams", [
            'teams' => [
                $players[0] => 'one',
                $players[1] => 'two',
                $players[2] => 'one',
                $players[3] => 'two',
            ],
        ])->assertSessionHasErrors('teams');
    }

    public function test_opening_a_board_does_not_add_the_person_to_the_rotation(): void
    {
        $session = $this->makeSession();

        $this->post('/open-play/open', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();

        /* Running the session is not playing in it. */
        $this->assertSame(0, $session->players()->count());
        $this->assertSame(0, $session->queue()->count());
    }
}
