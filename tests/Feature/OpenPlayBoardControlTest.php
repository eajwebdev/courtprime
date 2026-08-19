<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\ClubMatch;
use App\Models\Court;
use App\Models\OpenPlaySession;
use App\Models\OpenPlaySessionCourt;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * One device scores a court at a time.
 *
 * The session ID and key are shared, so they let everybody in: a club with two
 * courts going needs the two people standing at them both keeping score. What
 * is limited is courts — one scorer each — and how the session itself is run,
 * which stays with whoever opened it. Two devices on one game is still the
 * thing being prevented: that is how a game ends up with two versions of its
 * score.
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

    /**
     * Staff do not need the pair for their own club.
     *
     * The ID and key exist so a board can be run by somebody with no account.
     * A club owner already holds stronger credentials, and was being sent to a
     * form to type a secret they are the one handing out — from a button on
     * their own admin page that promised to open the board.
     */
    public function test_a_signed_in_club_user_opens_their_own_board_without_the_key(): void
    {
        $session = $this->makeSession();

        $owner = User::factory()->create([
            'organization_id' => $session->organization_id,
            'branch_id' => $session->branch_id,
            'role_key' => 'organization_owner',
        ]);

        $this->actingAs($owner)
            ->get('/open-play/OP-TEST01/board')
            ->assertOk();

        /* And with the board in hand, not merely watching it. */
        $this->actingAs($owner)
            ->post('/open-play/OP-TEST01/settings', [
                'name' => 'Renamed by staff',
                'format' => 'doubles',
                'target_score' => 11,
                'win_by_two' => true,
                'court_ids' => [],
            ])
            ->assertRedirect();

        $this->assertSame('Renamed by staff', $session->fresh()->name);
    }

    /** Being signed in somewhere else is not being signed in here. */
    public function test_a_signed_in_user_from_another_club_still_needs_the_key(): void
    {
        $this->makeSession();

        $stranger = Organization::query()->create([
            'name' => 'Other Club',
            'slug' => 'other-club',
            'status' => 'active',
            'timezone' => 'Asia/Manila',
            'currency' => 'PHP',
        ]);

        $outsider = User::factory()->create([
            'organization_id' => $stranger->id,
            'role_key' => 'organization_owner',
        ]);

        /* Bounced to the gate exactly as a stranger with no account is. */
        $this->actingAs($outsider)
            ->get('/open-play/OP-TEST01/board')
            ->assertRedirect('/open-play/board');

        $this->actingAs($outsider)
            ->post('/open-play/OP-TEST01/settings', [
                'name' => 'Taken over',
                'format' => 'doubles',
                'target_score' => 11,
                'win_by_two' => true,
                'court_ids' => [],
            ])
            ->assertForbidden();
    }

    /**
     * The setup screen offers an empty player cap and calls it no limit, and
     * saving it failed on a NOT NULL column — which at the tablet looked like
     * the session refusing to save at all.
     */
    public function test_a_session_can_be_saved_with_no_player_cap(): void
    {
        $session = $this->makeSession();

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();

        $this->post('/open-play/OP-TEST01/settings', [
            'name' => 'Uncapped',
            'format' => 'doubles',
            'target_score' => 11,
            'win_by_two' => true,
            'max_players' => null,
            'court_ids' => [],
        ])->assertRedirect();

        $this->assertNull($session->fresh()->max_players);
    }

    /** The pair is still the only way in without an account. */
    public function test_an_anonymous_visitor_still_needs_the_key(): void
    {
        $this->makeSession();

        $this->get('/open-play/OP-TEST01/board')->assertRedirect('/open-play/board');

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => 'wrong'])
            ->assertSessionHasErrors('code');
    }

    /**
     * The pair is shared, so it lets everybody in.
     *
     * A club with two courts going needs two people scoring them. What is
     * limited is courts, not doors: the second person through gets the board
     * but not the host's job, and takes a court to score.
     */
    public function test_a_second_device_can_open_the_same_board(): void
    {
        $this->makeSession();

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])
            ->assertRedirect('/open-play/OP-TEST01/board');

        /* A second browser: same pair, no shared session. */
        $this->flushSession();

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])
            ->assertRedirect('/open-play/OP-TEST01/board');

        $this->get('/open-play/OP-TEST01/board')->assertOk();

        /* But running the session is still the first person's job. */
        $this->post('/open-play/OP-TEST01/settings', [
            'name' => 'Taken over',
            'format' => 'doubles',
            'target_score' => 11,
            'win_by_two' => true,
            'court_ids' => [],
        ])->assertForbidden();
    }

    /**
     * Two courts, two scorers, and neither can touch the other's game.
     *
     * This is the whole point of holding courts rather than the board: the
     * people standing at the two courts each keep their own score, and the one
     * thing still being prevented is two devices on one game.
     */
    public function test_a_court_is_scored_by_one_device_and_the_rest_are_free(): void
    {
        $session = $this->makeSession();
        $courtOne = $session->courts()->first();

        $courtTwo = Court::query()->create([
            'organization_id' => $session->organization_id,
            'branch_id' => $session->branch_id,
            'name' => 'Court 2',
            'court_number' => 2,
            'status' => 'available',
            'standard_hourly_rate' => 500,
        ]);

        OpenPlaySessionCourt::query()->create([
            'organization_id' => $session->organization_id,
            'open_play_session_id' => $session->id,
            'court_id' => $courtTwo->id,
        ]);

        /* First person in takes court one. */
        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();
        $this->post("/open-play/OP-TEST01/courts/{$courtOne->id}/claim")->assertRedirect();
        $this->post("/open-play/OP-TEST01/courts/{$courtOne->id}/claim")->assertRedirect();

        /* Second person, second browser, same pair. */
        $this->flushSession();
        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();

        /* Court one is taken, so they are turned away from it… */
        $this->post("/open-play/OP-TEST01/courts/{$courtOne->id}/claim")
            ->assertSessionHasErrors('court');

        /* …and court two is theirs. */
        $this->post("/open-play/OP-TEST01/courts/{$courtTwo->id}/claim")
            ->assertSessionHasNoErrors();

        $this->assertDatabaseCount('open_play_court_holds', 2);
    }

    /**
     * Signing out stops you scoring.
     *
     * The proof of a court hold lives in the server session, and logging out
     * throws that away — so without releasing first the court reads as taken
     * by a token that no longer exists anywhere, and nobody can score it until
     * the stale window runs out. A scorer who was not the host had nothing
     * released at all.
     */
    public function test_signing_out_puts_down_every_court_that_device_was_scoring(): void
    {
        $session = $this->makeSession();
        $court = $session->courts()->first();

        $user = User::factory()->create([
            'organization_id' => $session->organization_id,
            'branch_id' => $session->branch_id,
            'role_key' => 'front_desk',
        ]);

        $this->actingAs($user)->get('/open-play/OP-TEST01/board')->assertOk();
        $this->actingAs($user)->post("/open-play/OP-TEST01/courts/{$court->id}/claim")->assertSessionHasNoErrors();

        $this->assertDatabaseCount('open_play_court_holds', 1);

        $this->actingAs($user)->post('/logout');

        /* Nobody is scoring it, so the next person can pick it straight up. */
        $this->assertDatabaseCount('open_play_court_holds', 0);
    }

    /** Handing the board back hands the courts back with it. */
    public function test_leaving_the_board_puts_down_its_courts(): void
    {
        $session = $this->makeSession();
        $court = $session->courts()->first();

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();
        $this->post("/open-play/OP-TEST01/courts/{$court->id}/claim")->assertSessionHasNoErrors();

        $this->assertDatabaseCount('open_play_court_holds', 1);

        $this->post('/open-play/OP-TEST01/release')->assertRedirect('/open-play/board');

        $this->assertDatabaseCount('open_play_court_holds', 0);
    }

    /**
     * An ended session is not a way in any more.
     *
     * The ID and key are only accepted for a scheduled, open or live session,
     * so ending one turns the pair off for everybody — including whoever was
     * already holding a board or scoring a court on it.
     */
    public function test_ending_a_session_turns_its_id_and_key_off(): void
    {
        $session = $this->makeSession();
        $court = $session->courts()->first();

        $owner = User::factory()->create([
            'organization_id' => $session->organization_id,
            'branch_id' => $session->branch_id,
            'role_key' => 'organization_owner',
        ]);

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();
        $this->post("/open-play/OP-TEST01/courts/{$court->id}/claim")->assertSessionHasNoErrors();
        $this->get('/open-play/OP-TEST01/board')->assertOk();

        /* Staff close the night from the office. */
        $this->actingAs($owner)->post("/open-play/{$session->id}/end-session")->assertRedirect();

        $this->assertSame('completed', $session->fresh()->status);
        /* Nobody is left holding a court on a session nobody can open. */
        $this->assertDatabaseCount('open_play_court_holds', 0);

        /* The browser that was running it is turned away now. */
        $this->get('/open-play/OP-TEST01/board')->assertRedirect('/open-play/board');

        /* And the pair no longer opens anything, for anybody. */
        $this->flushSession();
        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])
            ->assertSessionHasErrors('code');
    }

    /** Games still on when the night is called did not finish, so they count for nobody. */
    public function test_ending_a_session_cancels_the_games_still_on(): void
    {
        $session = $this->makeSession();

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();

        foreach (['A Player', 'B Player', 'C Player', 'D Player'] as $name) {
            $this->post('/open-play/OP-TEST01/players', ['name' => $name])->assertRedirect();
        }

        $this->post('/open-play/OP-TEST01/start')->assertRedirect();

        $match = $session->matches()->where('status', 'live')->firstOrFail();

        /* The host ends it from the board. */
        $this->post('/open-play/OP-TEST01/end')->assertRedirect('/open-play/board');

        $this->assertSame('cancelled', $match->fresh()->status);
        $this->assertSame('completed', $session->fresh()->status);

        /*
         * And no replacement was drawn. Cancelling frees a court, and a session
         * still rotating refills a free court at once — so closing the night
         * after clearing the courts left a fresh game on every one of them.
         */
        $this->assertSame(
            0,
            $session->matches()->where('status', 'live')->count(),
            'Ending the session left a game running.',
        );
    }

    /** Only the host may close the night. */
    public function test_a_court_scorer_cannot_end_the_session(): void
    {
        $session = $this->makeSession();
        $court = $session->courts()->first();

        /* Host takes the board first. */
        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();

        /* Second person: in with the pair, scoring a court, not the host. */
        $this->flushSession();
        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();
        $this->post("/open-play/OP-TEST01/courts/{$court->id}/claim")->assertSessionHasNoErrors();

        $this->post('/open-play/OP-TEST01/end')->assertForbidden();

        $this->assertNotSame('completed', $session->fresh()->status);
    }

    /** A court put down is a court somebody else can pick up. */
    public function test_releasing_a_court_frees_it_for_the_next_person(): void
    {
        $session = $this->makeSession();
        $court = $session->courts()->first();

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();
        $this->post("/open-play/OP-TEST01/courts/{$court->id}/claim")->assertSessionHasNoErrors();

        $this->flushSession();
        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();
        $this->post("/open-play/OP-TEST01/courts/{$court->id}/claim")->assertSessionHasErrors('court');

        /* The first person puts it down from their own browser. */
        $this->flushSession();
        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();
        $this->post("/open-play/OP-TEST01/courts/{$court->id}/claim")->assertSessionHasErrors('court');

        /* Nobody has checked in on it for long enough that it is not a hold
           any more, which is how a flat phone stops locking a court. */
        DB::table('open_play_court_holds')->update(['last_seen_at' => now()->subHour(), 'claimed_at' => now()->subHour()]);

        $this->post("/open-play/OP-TEST01/courts/{$court->id}/claim")->assertSessionHasNoErrors();
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

    /**
     * Signing out puts the board down.
     *
     * The proof of the hold lives in the server session, and logging out throws
     * that away. Without releasing first, the board stayed flagged as held by a
     * token nobody could present any more: live on the desk, and shut against
     * the next player with the right pair until the stale window ran out.
     */
    public function test_signing_out_releases_the_board_so_another_player_can_take_it(): void
    {
        $session = $this->makeSession();

        $user = User::factory()->create();

        $this->actingAs($user);
        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])
            ->assertRedirect('/open-play/OP-TEST01/board');

        $this->assertNotNull($session->refresh()->organizer_token);

        $this->post('/logout')->assertRedirect('/');

        /* Nobody is holding it: the desk reads it as free, and so does the gate. */
        $this->assertNull($session->refresh()->organizer_token);
        $this->assertNull($session->organizer_claimed_at);

        /* Another player, another browser, same ID and key. */
        $this->flushSession();

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])
            ->assertRedirect('/open-play/OP-TEST01/board');

        $this->assertNotNull($session->refresh()->organizer_token);
    }

    /**
     * Signing out elsewhere does not reach across and drop a board that another
     * device is running. The hold belongs to the browser, not to the account.
     */
    public function test_signing_out_leaves_a_board_held_by_a_different_device_alone(): void
    {
        $session = $this->makeSession();

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();

        $held = $session->refresh()->organizer_token;

        /* A different browser, signed in, holding no board. */
        $this->flushSession();
        $this->actingAs(User::factory()->create());

        $this->post('/logout')->assertRedirect('/');

        $this->assertSame($held, $session->refresh()->organizer_token);
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

        /* The second person is let in, as anybody with the pair now is — but
           the host's job stays with the device that is still checking in. */
        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])
            ->assertRedirect('/open-play/OP-TEST01/board');

        $this->post('/open-play/OP-TEST01/settings', [
            'name' => 'Taken over',
            'format' => 'doubles',
            'target_score' => 11,
            'win_by_two' => true,
            'court_ids' => [],
        ])->assertForbidden();
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

    /**
     * Changing partners on a game already under way restarts it.
     *
     * Refusing outright left the only advice as "tap the points away one at a
     * time", and partners genuinely do change. Carrying the points over is the
     * thing that cannot happen: they were won by pairs that no longer exist.
     * So it is allowed, it is asked about first, and the game starts again.
     */
    public function test_changing_partners_mid_game_is_asked_about_and_restarts_the_score(): void
    {
        $session = $this->makeSession();

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();

        foreach (['A Player', 'B Player', 'C Player', 'D Player'] as $name) {
            $this->post('/open-play/OP-TEST01/players', ['name' => $name])->assertRedirect();
        }

        $this->post('/open-play/OP-TEST01/start')->assertRedirect();

        $match = $session->matches()->where('status', 'live')->firstOrFail();
        $players = $match->participants()->pluck('player_id');
        $sides = [
            $players[0] => 'one',
            $players[1] => 'two',
            $players[2] => 'one',
            $players[3] => 'two',
        ];

        $this->post("/open-play/OP-TEST01/matches/{$match->id}/score", ['team' => 'team_one'])->assertRedirect();

        $clubMatch = ClubMatch::query()->findOrFail($match->club_match_id);
        $this->assertSame(1, (int) $clubMatch->team_one_score);

        /* Not without saying so: the points are somebody's. */
        $this->post("/open-play/OP-TEST01/matches/{$match->id}/teams", ['teams' => $sides])
            ->assertSessionHasErrors('teams');

        $this->assertSame(1, (int) $clubMatch->fresh()->team_one_score);

        /* Acknowledged, and the game starts again from nil all. */
        $this->post("/open-play/OP-TEST01/matches/{$match->id}/teams", ['teams' => $sides, 'restart' => true])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $clubMatch->refresh();

        $this->assertSame(0, (int) $clubMatch->team_one_score);
        $this->assertSame(0, (int) $clubMatch->team_two_score);
        $this->assertSame('live', $clubMatch->status);

        /* The point that was scored is still on the record, alongside the
           restart, so what happened is answerable. */
        $this->assertDatabaseHas('score_events', ['club_match_id' => $clubMatch->id, 'event_type' => 'score_reset']);
        $this->assertDatabaseHas('score_events', ['club_match_id' => $clubMatch->id, 'event_type' => 'score_increment']);
    }

    /** Before a point is scored, changing partners is free and changes nothing else. */
    public function test_changing_partners_before_the_first_point_needs_no_restart(): void
    {
        $session = $this->makeSession();

        $this->post('/open-play/board', ['code' => 'OP-TEST01', 'key' => '1234'])->assertRedirect();

        foreach (['A Player', 'B Player', 'C Player', 'D Player'] as $name) {
            $this->post('/open-play/OP-TEST01/players', ['name' => $name])->assertRedirect();
        }

        $this->post('/open-play/OP-TEST01/start')->assertRedirect();

        $match = $session->matches()->where('status', 'live')->firstOrFail();
        $players = $match->participants()->pluck('player_id');

        $this->post("/open-play/OP-TEST01/matches/{$match->id}/teams", [
            'teams' => [
                $players[0] => 'one',
                $players[1] => 'two',
                $players[2] => 'one',
                $players[3] => 'two',
            ],
        ])->assertSessionHasNoErrors();

        $this->assertSame('one', $match->participants()->where('player_id', $players[0])->value('team'));
        $this->assertSame('two', $match->participants()->where('player_id', $players[1])->value('team'));
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
