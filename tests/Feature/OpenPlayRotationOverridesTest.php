<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\ClubMatch;
use App\Models\Court;
use App\Models\OpenPlayMatch;
use App\Models\OpenPlayQueueEntry;
use App\Models\OpenPlaySession;
use App\Models\OpenPlaySessionCourt;
use App\Models\Organization;
use App\Models\Player;
use App\Services\OpenPlayRotationService;
use App\Services\OpenPlayService;
use App\Services\PaddleStackService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The things the automatic rotation cannot decide for itself.
 *
 * Substituting somebody who walks off mid game, voiding a game that should
 * never have counted, pausing, reordering the line, and swapping a partner in
 * before the first point. All of them have to leave the FIFO guarantee intact:
 * nobody gets cuts, and nobody is sent to the back for something they did not
 * ask for.
 */
class OpenPlayRotationOverridesTest extends TestCase
{
    use RefreshDatabase;

    private Organization $organization;

    private Branch $branch;

    /** @var array<int, Player> */
    private array $players = [];

    private function makeSession(string $format = 'doubles', int $courts = 1): OpenPlaySession
    {
        $this->organization = Organization::query()->create([
            'name' => 'Override Club',
            'slug' => 'override-club',
            'status' => 'active',
            'timezone' => 'Asia/Manila',
            'currency' => 'PHP',
        ]);

        $this->branch = Branch::query()->create([
            'organization_id' => $this->organization->id,
            'name' => 'Main',
            'code' => 'OC-MAIN',
            'status' => 'active',
        ]);

        $session = OpenPlaySession::query()->create([
            'organization_id' => $this->organization->id,
            'branch_id' => $this->branch->id,
            'name' => 'Tonight',
            'session_code' => 'OP-OVER',
            'session_key' => '1234',
            'session_date' => today(),
            'start_time' => '18:00',
            'end_time' => '22:00',
            'status' => 'open',
            'current_round' => 0,
            'auto_rotate' => true,
            'format' => $format,
            'target_score' => 11,
            'win_by_two' => true,
        ]);

        foreach (range(1, $courts) as $number) {
            $court = Court::query()->create([
                'organization_id' => $this->organization->id,
                'branch_id' => $this->branch->id,
                'name' => 'Court '.$number,
                'court_number' => $number,
                'status' => 'available',
                'standard_hourly_rate' => 500,
            ]);

            OpenPlaySessionCourt::query()->create([
                'organization_id' => $this->organization->id,
                'open_play_session_id' => $session->id,
                'court_id' => $court->id,
            ]);
        }

        return $session;
    }

    private function join(OpenPlaySession $session, int $count): void
    {
        $service = app(OpenPlayService::class);

        for ($index = 1; $index <= $count; $index++) {
            $player = $this->players[$index] ??= Player::query()->create([
                'organization_id' => $this->organization->id,
                'name' => 'P'.$index,
                'rating' => 3.5,
                'skill_level' => 'intermediate',
            ]);

            $service->join($session, $player);
            $service->checkIn($session, $player);

            $this->travel(1)->seconds();
        }
    }

    private function labelOf(int $playerId): string
    {
        foreach ($this->players as $index => $player) {
            if ($player->id === $playerId) {
                return 'P'.$index;
            }
        }

        return '?';
    }

    /** @return array<int, string> */
    private function queueLabels(OpenPlaySession $session): array
    {
        return app(PaddleStackService::class)
            ->waitingQueue($session)
            ->map(fn (OpenPlayQueueEntry $entry) => $this->labelOf((int) $entry->player_id))
            ->all();
    }

    /** @return array<int, string> */
    private function onCourtLabels(OpenPlaySession $session): array
    {
        $ids = app(PaddleStackService::class)->onCourtPlayerIds($session);

        return collect($ids)->map(fn (int $id) => $this->labelOf($id))->sort()->values()->all();
    }

    private function liveMatch(OpenPlaySession $session): OpenPlayMatch
    {
        return OpenPlayMatch::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->where('status', 'live')
            ->firstOrFail();
    }

    private function idOf(string $label): int
    {
        return $this->players[(int) substr($label, 1)]->id;
    }

    /* ---------------------------------------------------------------- */
    /* Leaving mid game */
    /* ---------------------------------------------------------------- */

    public function test_a_player_leaving_mid_game_is_replaced_from_the_front_of_the_queue(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 5);
        app(OpenPlayRotationService::class)->generate($session);

        /* P5 is the only one waiting, so P5 is the one who comes on. */
        app(OpenPlayService::class)->leave($session, $this->players[1]);

        /* The court is still full, the game was never interrupted. */
        $this->assertCount(4, app(PaddleStackService::class)->onCourtPlayerIds($session));
        $this->assertContains('P5', $this->onCourtLabels($session));
        $this->assertNotContains('P1', $this->onCourtLabels($session));
        $this->assertSame([], $this->queueLabels($session));
    }

    public function test_a_player_leaving_mid_game_with_nobody_waiting_leaves_the_court_short(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 4);
        app(OpenPlayRotationService::class)->generate($session);

        app(OpenPlayService::class)->leave($session, $this->players[1]);

        /* Nobody to come on, so the game plays out three-handed rather than
           being abandoned. */
        $this->assertCount(3, app(PaddleStackService::class)->onCourtPlayerIds($session));
        $this->assertSame(1, OpenPlayMatch::query()->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)->where('status', 'live')->count());
    }

    public function test_the_replacement_keeps_the_score_and_the_match(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 5);
        app(OpenPlayRotationService::class)->generate($session);

        $match = $this->liveMatch($session);
        $clubMatch = ClubMatch::query()->withoutGlobalScope('organization')->find($match->club_match_id);
        $clubMatch->update(['team_one_score' => 6, 'team_two_score' => 3]);

        app(OpenPlayService::class)->leave($session, $this->players[1]);

        $clubMatch->refresh();

        /* Same match, same score: a substitution is not a restart. */
        $this->assertSame($match->id, $this->liveMatch($session)->id);
        $this->assertSame(6, (int) $clubMatch->team_one_score);
        $this->assertSame(3, (int) $clubMatch->team_two_score);
    }

    public function test_the_scoreboard_names_follow_whoever_is_actually_on_court(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 5);
        app(OpenPlayRotationService::class)->generate($session);

        $match = $this->liveMatch($session);
        $before = ClubMatch::query()->withoutGlobalScope('organization')->find($match->club_match_id);
        $names = $before->team_one_name.' / '.$before->team_two_name;

        /* P1 walks off and P5 takes the seat. */
        app(OpenPlayService::class)->leave($session, $this->players[1]);

        $after = $before->fresh();
        $shown = $after->team_one_name.' / '.$after->team_two_name;

        $this->assertStringNotContainsString('P1', $shown, 'A player who has gone home must not stay printed above the score.');
        $this->assertStringContainsString('P5', $shown);
        $this->assertNotSame($names, $shown);
    }

    /* ---------------------------------------------------------------- */
    /* Cancelling */
    /* ---------------------------------------------------------------- */

    public function test_a_cancelled_game_credits_nobody_and_does_not_rotate(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 4);
        app(OpenPlayRotationService::class)->generate($session);

        $match = $this->liveMatch($session);

        app(OpenPlayRotationService::class)->cancelMatch($match);

        $entries = OpenPlayQueueEntry::query()->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)->get();

        foreach ($entries as $entry) {
            $this->assertSame(0, (int) $entry->games_played, 'A cancelled game must not count as played.');
            $this->assertSame(0, (int) $entry->consecutive_games_played);
        }

        $this->assertSame('cancelled', $match->fresh()->status);
    }

    public function test_a_cancelled_game_puts_its_players_back_in_the_queue_behind_whoever_was_waiting(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 4);
        app(OpenPlayRotationService::class)->generate($session);

        /* P5 turns up while the game that is about to be voided is on. */
        $this->join($session, 5);

        app(OpenPlayRotationService::class)->cancelMatch($this->liveMatch($session));

        /* P5 was waiting first, so P5 is served first — and with five players
           and one court, the next match is drawn from the front of that. */
        $this->assertContains('P5', $this->onCourtLabels($session));
    }

    /* ---------------------------------------------------------------- */
    /* Pausing */
    /* ---------------------------------------------------------------- */

    public function test_resuming_deals_the_queue_back_out(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 4);
        app(OpenPlayRotationService::class)->generate($session);

        $session->update(['auto_rotate' => false]);
        app(OpenPlayRotationService::class)->completeMatch($this->liveMatch($session));

        $this->assertCount(4, $this->queueLabels($session));

        $session->update(['auto_rotate' => true]);
        app(OpenPlayRotationService::class)->generate($session->refresh());

        $this->assertCount(4, app(PaddleStackService::class)->onCourtPlayerIds($session));
    }

    /* ---------------------------------------------------------------- */
    /* Reordering the line */
    /* ---------------------------------------------------------------- */

    public function test_staff_can_move_a_player_up_the_queue(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 4);
        app(OpenPlayRotationService::class)->generate($session);

        $this->join($session, 8);
        $this->assertSame(['P5', 'P6', 'P7', 'P8'], $this->queueLabels($session));

        app(PaddleStackService::class)->moveToPosition($session, $this->idOf('P8'), 1);

        $this->assertSame(['P8', 'P5', 'P6', 'P7'], $this->queueLabels($session));
    }

    public function test_a_reordered_queue_is_the_order_players_are_actually_called_in(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 4);
        app(OpenPlayRotationService::class)->generate($session);

        $this->join($session, 5);
        app(PaddleStackService::class)->moveToPosition($session, $this->idOf('P5'), 1);

        app(OpenPlayRotationService::class)->completeMatch($this->liveMatch($session));

        $this->assertContains('P5', $this->onCourtLabels($session));
    }

    public function test_swapping_two_waiting_players_leaves_everyone_else_where_they_were(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 4);
        app(OpenPlayRotationService::class)->generate($session);

        $this->join($session, 8);

        app(PaddleStackService::class)->swap($session, $this->idOf('P5'), $this->idOf('P8'));

        $this->assertSame(['P8', 'P6', 'P7', 'P5'], $this->queueLabels($session));
    }

    public function test_a_reorder_cannot_add_or_drop_anybody(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 4);
        app(OpenPlayRotationService::class)->generate($session);

        $this->join($session, 7);
        $before = $this->queueLabels($session);

        /* A short list, and a list naming somebody on court, are both refused
           outright rather than partly applied. */
        app(PaddleStackService::class)->reorder($session, [$this->idOf('P7'), $this->idOf('P6')]);
        $this->assertSame($before, $this->queueLabels($session));

        app(PaddleStackService::class)->reorder($session, [$this->idOf('P5'), $this->idOf('P6'), $this->idOf('P1')]);
        $this->assertSame($before, $this->queueLabels($session));
    }

    /* ---------------------------------------------------------------- */
    /* Forcing who rotates */
    /* ---------------------------------------------------------------- */

    public function test_staff_can_force_a_specific_player_off(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 4);
        app(OpenPlayRotationService::class)->generate($session);

        $this->join($session, 5);

        /* Everyone has the same streak, so without the override the automatic
           tie-breakers would take P1. Staff names P3 instead. */
        app(OpenPlayRotationService::class)->completeMatch($this->liveMatch($session), forceOut: [$this->idOf('P3')]);

        $this->assertNotContains('P3', $this->onCourtLabels($session));
        $this->assertContains('P5', $this->onCourtLabels($session));
    }

    public function test_staff_can_keep_a_player_on(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 4);
        app(OpenPlayRotationService::class)->generate($session);

        $this->join($session, 5);

        /* P1 would come off first on the automatic order; keeping them on
           moves the choice to somebody else. */
        app(OpenPlayRotationService::class)->completeMatch($this->liveMatch($session), keep: [$this->idOf('P1')]);

        $this->assertContains('P1', $this->onCourtLabels($session));
        $this->assertContains('P5', $this->onCourtLabels($session));
    }

    public function test_keeping_everyone_on_cannot_stall_the_queue(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 4);
        app(OpenPlayRotationService::class)->generate($session);

        $this->join($session, 5);

        $onCourt = app(PaddleStackService::class)->onCourtPlayerIds($session);

        /* Protecting all four is not honourable — somebody has to come off for
           the player who is waiting, or the queue never moves. */
        app(OpenPlayRotationService::class)->completeMatch($this->liveMatch($session), keep: $onCourt);

        $this->assertContains('P5', $this->onCourtLabels($session));
        $this->assertCount(4, $this->onCourtLabels($session));
    }

    /* ---------------------------------------------------------------- */
    /* Swapping a partner in, before the first point */
    /* ---------------------------------------------------------------- */

    public function test_swapping_a_partner_in_exchanges_places_rather_than_queue_jumping(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 4);
        app(OpenPlayRotationService::class)->generate($session);

        $this->join($session, 7);
        $this->assertSame(['P5', 'P6', 'P7'], $this->queueLabels($session));

        /* P6 comes on for P1: P1 takes P6's exact spot in the line, so P5 is
           still first and P7 is still last. Nobody else moved. */
        $this->assertTrue(app(PaddleStackService::class)->exchange($session, $this->idOf('P1'), $this->idOf('P6')));

        $this->assertSame(['P5', 'P1', 'P7'], $this->queueLabels($session));
        $this->assertContains('P6', $this->onCourtLabels($session));
        $this->assertNotContains('P1', $this->onCourtLabels($session));
    }

    public function test_a_swap_does_not_credit_anybody_with_a_game(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 5);
        app(OpenPlayRotationService::class)->generate($session);

        app(PaddleStackService::class)->exchange($session, $this->idOf('P1'), $this->idOf('P5'));

        foreach (OpenPlayQueueEntry::query()->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)->get() as $entry) {
            $this->assertSame(0, (int) $entry->games_played, 'Nothing has been played yet, so nobody owes a game.');
        }
    }

    /* ---------------------------------------------------------------- */
    /* Format */
    /* ---------------------------------------------------------------- */

    public function test_capacity_comes_from_the_session_for_both_formats(): void
    {
        $doubles = $this->makeSession('doubles');
        $this->assertSame(4, $doubles->capacity());
        $this->assertSame(4, app(PaddleStackService::class)->capacity($doubles));
        $this->assertSame(4, app(OpenPlayRotationService::class)->playersPerMatch($doubles));

        $doubles->update(['format' => 'singles']);

        $this->assertSame(2, $doubles->capacity());
        $this->assertSame(2, app(PaddleStackService::class)->capacity($doubles));
        $this->assertSame(2, app(OpenPlayRotationService::class)->playersPerMatch($doubles));
    }

    public function test_singles_substitutes_the_one_person_waiting_when_a_player_walks_off(): void
    {
        $session = $this->makeSession('singles');
        $this->join($session, 3);
        app(OpenPlayRotationService::class)->generate($session);

        app(OpenPlayService::class)->leave($session, $this->players[1]);

        $this->assertCount(2, app(PaddleStackService::class)->onCourtPlayerIds($session));
        $this->assertContains('P3', $this->onCourtLabels($session));
    }
}
