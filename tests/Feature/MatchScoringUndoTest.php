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
 * Taking a point back takes it off the right team.
 *
 * The open play board undoes with a double tap on the half you tapped by
 * mistake, so which team the undo belongs to is the whole question.
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
        /* The other team scores last, which is the case that used to break it. */
        $scoring->increment($match->fresh(), 'team_two');

        $scoring->undo($match->fresh(), null, 'team_one');

        $match = $match->fresh();

        $this->assertSame(0, (int) $match->team_one_score);
        $this->assertSame(1, (int) $match->team_two_score, 'Undoing one team must not take a point off the other.');
    }

    public function test_undo_without_a_team_still_takes_the_last_point(): void
    {
        $match = $this->makeMatch();
        $scoring = app(MatchScoringService::class);

        $scoring->increment($match->fresh(), 'team_one');
        $scoring->increment($match->fresh(), 'team_two');

        $scoring->undo($match->fresh());

        $match = $match->fresh();

        $this->assertSame(1, (int) $match->team_one_score);
        $this->assertSame(0, (int) $match->team_two_score);
    }
}
