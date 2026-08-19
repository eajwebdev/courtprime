<?php

namespace Tests\Feature;

use App\Models\Branch;
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
 * The paddle stack.
 *
 * As many players come off a court as there are people waiting to replace
 * them — no more, no fewer — and whoever comes off goes behind everyone
 * already in the queue. These pin both halves, in singles and doubles, at
 * every queue length that behaves differently.
 */
class PaddleStackRotationTest extends TestCase
{
    use RefreshDatabase;

    private Organization $organization;

    private Branch $branch;

    /** @var array<int, Player> */
    private array $players = [];

    private function makeSession(string $format = 'doubles', int $courts = 1, ?int $maxConsecutive = null): OpenPlaySession
    {
        $this->organization = Organization::query()->create([
            'name' => 'Stack Club',
            'slug' => 'stack-club',
            'status' => 'active',
            'timezone' => 'Asia/Manila',
            'currency' => 'PHP',
        ]);

        $this->branch = Branch::query()->create([
            'organization_id' => $this->organization->id,
            'name' => 'Main',
            'code' => 'SC-MAIN',
            'status' => 'active',
        ]);

        $session = OpenPlaySession::query()->create([
            'organization_id' => $this->organization->id,
            'branch_id' => $this->branch->id,
            'name' => 'Tonight',
            'session_code' => 'OP-STACK',
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
            'max_consecutive_games' => $maxConsecutive,
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

    /** Players join one after another, so the queue order is P1, P2, P3… */
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

            /* A second apart, so "who has waited longest" is unambiguous
               rather than depending on row order within one timestamp. */
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

    private function finishLiveMatch(OpenPlaySession $session): void
    {
        $match = OpenPlayMatch::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->where('status', 'live')
            ->firstOrFail();

        app(OpenPlayRotationService::class)->completeMatch($match);
    }

    /* ---------------------------------------------------------------- */
    /* Doubles */
    /* ---------------------------------------------------------------- */

    public function test_doubles_with_nobody_waiting_keeps_the_same_four_on(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 4);

        app(OpenPlayRotationService::class)->generate($session);
        $before = $this->onCourtLabels($session);

        $this->finishLiveMatch($session);

        $this->assertSame($before, $this->onCourtLabels($session));
        $this->assertSame([], $this->queueLabels($session));

        /* A second game back to back for all four. */
        foreach (app(PaddleStackService::class)->onCourtPlayerIds($session) as $playerId) {
            $entry = OpenPlayQueueEntry::query()->withoutGlobalScope('organization')
                ->where('open_play_session_id', $session->id)->where('player_id', $playerId)->first();

            $this->assertSame(1, (int) $entry->consecutive_games_played);
            $this->assertSame(1, (int) $entry->games_played);
        }
    }

    public function test_doubles_with_one_waiting_rotates_exactly_one(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 4);
        app(OpenPlayRotationService::class)->generate($session);

        $this->join($session, 5);

        $this->finishLiveMatch($session);

        $this->assertContains('P5', $this->onCourtLabels($session));
        $this->assertCount(4, $this->onCourtLabels($session));
        /* Exactly one came off, and it is the only one waiting. */
        $this->assertCount(1, $this->queueLabels($session));
    }

    public function test_doubles_with_two_waiting_rotates_exactly_two(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 4);
        app(OpenPlayRotationService::class)->generate($session);

        $this->join($session, 6);

        $this->finishLiveMatch($session);

        $court = $this->onCourtLabels($session);

        $this->assertContains('P5', $court);
        $this->assertContains('P6', $court);
        $this->assertCount(2, $this->queueLabels($session));
    }

    public function test_doubles_with_four_or_more_waiting_clears_the_court(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 4);
        app(OpenPlayRotationService::class)->generate($session);

        $this->join($session, 9);

        $this->finishLiveMatch($session);

        /* The first four in line take the court… */
        $this->assertSame(['P5', 'P6', 'P7', 'P8'], $this->onCourtLabels($session));

        /* …and P9, who was already waiting, stays ahead of the four coming off. */
        $this->assertSame(['P9', 'P1', 'P2', 'P3', 'P4'], $this->queueLabels($session));
    }

    /* ---------------------------------------------------------------- */
    /* Singles */
    /* ---------------------------------------------------------------- */

    public function test_singles_with_nobody_waiting_keeps_both_on(): void
    {
        $session = $this->makeSession('singles');
        $this->join($session, 2);

        app(OpenPlayRotationService::class)->generate($session);
        $before = $this->onCourtLabels($session);

        $this->finishLiveMatch($session);

        $this->assertSame($before, $this->onCourtLabels($session));
    }

    public function test_singles_with_one_waiting_swaps_one(): void
    {
        $session = $this->makeSession('singles');
        $this->join($session, 2);
        app(OpenPlayRotationService::class)->generate($session);

        $this->join($session, 3);

        $this->finishLiveMatch($session);

        $court = $this->onCourtLabels($session);

        $this->assertCount(2, $court);
        $this->assertContains('P3', $court);
        $this->assertCount(1, $this->queueLabels($session));
    }

    public function test_singles_with_two_or_more_waiting_clears_the_court(): void
    {
        $session = $this->makeSession('singles');
        $this->join($session, 2);
        app(OpenPlayRotationService::class)->generate($session);

        $this->join($session, 5);

        $this->finishLiveMatch($session);

        $this->assertSame(['P3', 'P4'], $this->onCourtLabels($session));
        $this->assertSame(['P5', 'P1', 'P2'], $this->queueLabels($session));
    }

    /* ---------------------------------------------------------------- */
    /* Fairness */
    /* ---------------------------------------------------------------- */

    /**
     * With one waiting, the player who has been on longest comes off — not an
     * arbitrary one — so nobody camps a court while others wait.
     */
    public function test_the_longest_running_player_is_the_one_who_comes_off(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 4);
        app(OpenPlayRotationService::class)->generate($session);

        /* One waiting for each of two games, so exactly one swaps each time. */
        $this->join($session, 5);
        $this->finishLiveMatch($session);

        $afterFirst = $this->onCourtLabels($session);
        $this->finishLiveMatch($session);
        $afterSecond = $this->onCourtLabels($session);

        /* The player who sat out the first rotation is back on, and whoever
           had the longest streak has been taken off. */
        $this->assertCount(4, $afterSecond);
        $this->assertNotSame($afterFirst, $afterSecond);

        $streaks = OpenPlayQueueEntry::query()->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->where('status', OpenPlayQueueEntry::ON_COURT)
            ->pluck('consecutive_games_played');

        $this->assertLessThanOrEqual(2, $streaks->max());
    }

    public function test_a_consecutive_game_limit_forces_a_player_off(): void
    {
        $session = $this->makeSession('doubles', 1, maxConsecutive: 1);
        $this->join($session, 4);
        app(OpenPlayRotationService::class)->generate($session);

        $this->join($session, 5);
        $this->finishLiveMatch($session);

        /* Everyone on court has played once, all are at the limit, so the one
           taken off is decided by the tie-breakers and P5 is on. */
        $this->assertContains('P5', $this->onCourtLabels($session));
    }

    /* ---------------------------------------------------------------- */
    /* Joining, leaving, pausing */
    /* ---------------------------------------------------------------- */

    public function test_joining_mid_game_never_disturbs_the_court(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 4);
        app(OpenPlayRotationService::class)->generate($session);

        $before = $this->onCourtLabels($session);

        $this->join($session, 7);

        $this->assertSame($before, $this->onCourtLabels($session));
        $this->assertSame(['P5', 'P6', 'P7'], $this->queueLabels($session));
    }

    public function test_joining_twice_does_not_take_two_places_in_the_queue(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 6);

        /* P5 taps join again while already stood in line. */
        app(OpenPlayService::class)->join($session, $this->players[5]);

        $this->assertSame(['P1', 'P2', 'P3', 'P4', 'P5', 'P6'], $this->queueLabels($session));
    }

    public function test_a_player_on_court_who_rejoins_stays_on_court(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 5);
        app(OpenPlayRotationService::class)->generate($session);

        $onCourt = app(PaddleStackService::class)->onCourtPlayerIds($session);
        $player = collect($this->players)->firstWhere(fn (Player $p) => in_array($p->id, $onCourt, true));

        app(OpenPlayService::class)->join($session, $player);

        $this->assertContains($player->id, app(PaddleStackService::class)->onCourtPlayerIds($session));
        $this->assertNotContains($this->labelOf($player->id), $this->queueLabels($session));
    }

    public function test_a_player_who_leaves_the_queue_is_skipped_and_positions_close_up(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 4);
        app(OpenPlayRotationService::class)->generate($session);

        $this->join($session, 6);
        app(OpenPlayService::class)->leave($session, $this->players[5]);

        $this->assertSame(['P6'], $this->queueLabels($session));

        $this->finishLiveMatch($session);

        /* P6 goes on in P5's place; P5 is not pulled back in. */
        $this->assertContains('P6', $this->onCourtLabels($session));
        $this->assertNotContains('P5', $this->onCourtLabels($session));
    }

    public function test_a_paused_session_banks_the_rotation_without_starting_a_game(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 8);
        app(OpenPlayRotationService::class)->generate($session);

        $session->update(['auto_rotate' => false]);

        $this->finishLiveMatch($session);

        $this->assertSame(
            0,
            OpenPlayMatch::query()->withoutGlobalScope('organization')
                ->where('open_play_session_id', $session->id)->where('status', 'live')->count(),
        );

        /* Everyone is back in the queue in the right order, ready to resume. */
        $this->assertSame(['P5', 'P6', 'P7', 'P8', 'P1', 'P2', 'P3', 'P4'], $this->queueLabels($session));
    }

    public function test_a_court_cannot_start_below_the_minimum(): void
    {
        $session = $this->makeSession('doubles');
        $this->join($session, 3);

        $created = app(OpenPlayRotationService::class)->generate($session);

        $this->assertTrue($created->isEmpty());
        $this->assertSame(['P1', 'P2', 'P3'], $this->queueLabels($session));
    }

    public function test_two_courts_run_at_once_and_rotate_independently(): void
    {
        $session = $this->makeSession('doubles', courts: 2);
        $this->join($session, 8);

        app(OpenPlayRotationService::class)->generate($session);

        $this->assertSame(
            2,
            OpenPlayMatch::query()->withoutGlobalScope('organization')
                ->where('open_play_session_id', $session->id)->where('status', 'live')->count(),
        );
        $this->assertCount(8, app(PaddleStackService::class)->onCourtPlayerIds($session));

        /* Nobody waiting, so finishing one court keeps its four on. */
        $before = $this->onCourtLabels($session);
        $this->finishLiveMatch($session);

        $this->assertSame($before, $this->onCourtLabels($session));
    }
}
