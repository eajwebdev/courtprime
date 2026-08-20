<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Court;
use App\Models\OpenPlayMatch;
use App\Models\OpenPlaySession;
use App\Models\OpenPlaySessionCourt;
use App\Models\Organization;
use App\Models\Player;
use App\Services\OpenPlayRotationService;
use App\Services\OpenPlayService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A team that holds the court stays a team.
 *
 * The pairing score penalises a repeated partner harder than anything else, so
 * it used to break up the pair that had just won and held the court: the club
 * set a team, the team won, and the next game handed each of them somebody
 * else. Varying partners is for players coming off the queue.
 */
class OpenPlayPartnersStayTest extends TestCase
{
    use RefreshDatabase;

    private Organization $organization;

    /** @var array<int, Player> */
    private array $players = [];

    private function makeSession(): OpenPlaySession
    {
        $this->organization = Organization::query()->create([
            'name' => 'Pairs Club',
            'slug' => 'pairs-club',
            'status' => 'active',
            'timezone' => 'Asia/Manila',
            'currency' => 'PHP',
        ]);

        $branch = Branch::query()->create([
            'organization_id' => $this->organization->id,
            'name' => 'Main',
            'code' => 'PC-MAIN',
            'status' => 'active',
        ]);

        $session = OpenPlaySession::query()->create([
            'organization_id' => $this->organization->id,
            'branch_id' => $branch->id,
            'name' => 'Tonight',
            'session_code' => 'OP-PAIRS',
            'session_key' => '1234',
            'session_date' => today(),
            'start_time' => '18:00',
            'end_time' => '22:00',
            'status' => 'open',
            'current_round' => 0,
            'auto_rotate' => true,
            'format' => 'doubles',
            'target_score' => 11,
            'win_by_two' => true,
        ]);

        $court = Court::query()->create([
            'organization_id' => $this->organization->id,
            'branch_id' => $branch->id,
            'name' => 'Court 1',
            'court_number' => 1,
            'status' => 'available',
            'standard_hourly_rate' => 500,
        ]);

        OpenPlaySessionCourt::query()->create([
            'organization_id' => $this->organization->id,
            'open_play_session_id' => $session->id,
            'court_id' => $court->id,
        ]);

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

    /** @return array<string, array<int, int>> team => sorted player ids */
    private function teamsOf(OpenPlayMatch $match): array
    {
        return $match->participants()
            ->get(['player_id', 'team'])
            ->groupBy('team')
            ->map(fn ($members) => $members->pluck('player_id')->map(fn ($id) => (int) $id)->sort()->values()->all())
            ->all();
    }

    private function liveMatch(OpenPlaySession $session): OpenPlayMatch
    {
        return OpenPlayMatch::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->where('status', 'live')
            ->firstOrFail();
    }

    /**
     * Nobody waiting, so all four hold the court. Every one of them keeps the
     * partner they had.
     */
    public function test_a_full_court_with_nobody_waiting_keeps_both_teams(): void
    {
        $session = $this->makeSession();
        $this->join($session, 4);

        $rotation = app(OpenPlayRotationService::class);
        $rotation->generate($session);

        $first = $this->liveMatch($session);
        $before = $this->teamsOf($first);

        $rotation->completeMatch($first);

        $after = $this->teamsOf($this->liveMatch($session->refresh()));

        $this->assertSame($before['one'], $after['one']);
        $this->assertSame($before['two'], $after['two']);
    }

    /**
     * Two waiting, so one team rotates off and the other holds. The pair that
     * stayed is still a pair; the two who came on are the other team.
     */
    public function test_the_pair_that_holds_the_court_is_not_split_up(): void
    {
        $session = $this->makeSession();
        $this->join($session, 6);

        $rotation = app(OpenPlayRotationService::class);
        $rotation->generate($session);

        $first = $this->liveMatch($session);
        $before = $this->teamsOf($first);

        $rotation->completeMatch($first);

        $second = $this->liveMatch($session->refresh());
        $after = $this->teamsOf($second);

        $stayed = array_values(array_intersect(
            array_merge($before['one'], $before['two']),
            array_merge($after['one'], $after['two']),
        ));

        /* Two came off and two came on, so exactly two players held the
           court. */
        $this->assertCount(2, $stayed);

        sort($stayed);

        $this->assertContains(
            $stayed,
            [$after['one'], $after['two']],
            'The two players who held the court were split onto opposite teams.',
        );

        /* And they were a team before, not opponents who happened to stay. */
        $this->assertContains($stayed, [$before['one'], $before['two']]);
    }
}
