<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\ClubMatch;
use App\Models\Court;
use App\Models\Organization;
use App\Services\MatchScoringService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Pickleball side-out scoring.
 *
 * A tap means a side won the rally. The serving side scores a point; the
 * receiving side only moves the serve. Undo has to restore both.
 */
class MatchScoringUndoTest extends TestCase
{
    use RefreshDatabase;

    private function makeMatch(): ClubMatch
    {
        $organization = Organization::query()->create([
            'name' => 'Scoring Club',
            'slug' => 'scoring-club',
            'owner_name' => 'Owner',
            'email' => 'ops@scoring-club.test',
            'status' => 'active',
            'timezone' => 'Asia/Manila',
            'currency' => 'PHP',
        ]);

        $branch = Branch::query()->create([
            'organization_id' => $organization->id,
            'name' => 'Main',
            'code' => 'SC-MAIN',
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

        return ClubMatch::query()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'court_id' => $court->id,
            'match_type' => 'doubles',
            'team_one_name' => 'A',
            'team_two_name' => 'B',
            'status' => 'live',
            'started_at' => now(),
        ]);
    }

    public function test_undo_takes_the_point_off_the_team_it_is_asked_about(): void
    {
        $match = $this->makeMatch();
        $scoring = app(MatchScoringService::class);

        $scoring->increment($match->fresh(), 'team_one');
        /* Team two first earns the side-out, then scores on serve. */
        $scoring->increment($match->fresh(), 'team_two');
        $scoring->increment($match->fresh(), 'team_two');

        $scoring->undo($match->fresh(), null, 'team_one');

        $match = $match->fresh();

        $this->assertSame(0, (int) $match->team_one_score);
        $this->assertSame(1, (int) $match->team_two_score, 'Undoing one team must not take a point off the other.');
        $this->assertSame('team_two', $match->serving_team);
        $this->assertSame(1, (int) $match->serving_number);
    }

    public function test_undo_without_a_team_still_takes_the_last_point(): void
    {
        $match = $this->makeMatch();
        $scoring = app(MatchScoringService::class);

        $scoring->increment($match->fresh(), 'team_one');
        $scoring->increment($match->fresh(), 'team_two');
        $scoring->increment($match->fresh(), 'team_two');

        $scoring->undo($match->fresh());

        $match = $match->fresh();

        $this->assertSame(1, (int) $match->team_one_score);
        $this->assertSame(0, (int) $match->team_two_score);
        $this->assertSame('team_two', $match->serving_team);
        $this->assertSame(1, (int) $match->serving_number);
    }

    public function test_opening_doubles_rally_starts_at_zero_zero_two(): void
    {
        $match = $this->makeMatch();
        $scoring = app(MatchScoringService::class);

        $scoring->increment($match->fresh(), 'team_one');

        $match = $match->fresh();

        $this->assertSame(1, (int) $match->team_one_score);
        $this->assertSame(0, (int) $match->team_two_score);
        $this->assertSame('team_one', $match->serving_team);
        $this->assertSame(2, (int) $match->serving_number);
    }

    public function test_receiving_team_winning_opening_rally_gets_side_out_without_a_point(): void
    {
        $match = $this->makeMatch();
        $scoring = app(MatchScoringService::class);

        $scoring->increment($match->fresh(), 'team_two');

        $match = $match->fresh();

        $this->assertSame(0, (int) $match->team_one_score);
        $this->assertSame(0, (int) $match->team_two_score);
        $this->assertSame('team_two', $match->serving_team);
        $this->assertSame(1, (int) $match->serving_number);
        $this->assertDatabaseHas('score_events', [
            'club_match_id' => $match->id,
            'event_type' => 'serve_rotation',
            'team' => 'team_two',
        ]);
    }

    public function test_first_server_loss_moves_to_second_server_without_a_point(): void
    {
        $match = $this->makeMatch();
        $match->update([
            'team_one_score' => 3,
            'team_two_score' => 2,
            'serving_team' => 'team_one',
            'serving_number' => 1,
        ]);

        app(MatchScoringService::class)->increment($match->fresh(), 'team_two');

        $match = $match->fresh();

        $this->assertSame(3, (int) $match->team_one_score);
        $this->assertSame(2, (int) $match->team_two_score);
        $this->assertSame('team_one', $match->serving_team);
        $this->assertSame(2, (int) $match->serving_number);
    }
}
