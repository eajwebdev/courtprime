<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Court;
use App\Models\CourtAvailabilityBlock;
use App\Models\Organization;
use App\Models\Player;
use App\Models\Reservation;
use App\Services\CourtAvailabilityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * A taken slot says what took it.
 *
 * Shading answers "no" and nothing else. The grid is public, so what it may say
 * is bounded: a first name and a last initial, what kind of session it is, and
 * when the court frees up. Never an email, a mobile, a note or an amount.
 */
class CourtAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    private Organization $organization;

    private Branch $branch;

    private function makeCourt(string $status = 'available'): Court
    {
        $this->organization = Organization::query()->create([
            'name' => 'Test Club',
            'slug' => 'test-club-availability',
            'status' => 'active',
            'timezone' => 'Asia/Manila',
            'currency' => 'PHP',
        ]);

        $this->branch = Branch::query()->create([
            'organization_id' => $this->organization->id,
            'name' => 'Main',
            'code' => 'TCA-MAIN',
            'status' => 'active',
        ]);

        return Court::query()->create([
            'organization_id' => $this->organization->id,
            'branch_id' => $this->branch->id,
            'name' => 'Court 1',
            'court_number' => 1,
            'status' => $status,
            'standard_hourly_rate' => 500,
        ]);
    }

    private function book(Court $court, string $start, string $end, array $attributes = []): Reservation
    {
        return Reservation::query()->create([
            'organization_id' => $court->organization_id,
            'branch_id' => $court->branch_id,
            'court_id' => $court->id,
            'reference' => 'REF-'.$start,
            'reservation_date' => today()->toDateString(),
            'start_time' => $start,
            'end_time' => $end,
            'duration_minutes' => 60,
            'players_count' => 4,
            'booking_status' => 'confirmed',
            ...$attributes,
        ]);
    }

    /** @param  array<int, array<string, mixed>>  $slots */
    private function slotAt(array $slots, string $start): array
    {
        return collect($slots)->firstWhere('start_time', $start);
    }

    public function test_a_booked_slot_names_who_holds_it(): void
    {
        $court = $this->makeCourt();

        $player = Player::query()->create([
            'organization_id' => $this->organization->id,
            'name' => 'Maria Cruz',
            'email' => 'maria@example.test',
        ]);

        $this->book($court, '18:00', '20:00', ['player_id' => $player->id]);

        $slots = app(CourtAvailabilityService::class)->slots($court, today()->toDateString());

        $held = $this->slotAt($slots, '18:00');

        $this->assertFalse($held['available']);
        $this->assertSame('booked', $held['status']);
        /* First name, last initial — never the full surname. */
        $this->assertSame('Maria C.', $held['hold']['title']);
        $this->assertStringNotContainsString('Cruz', json_encode($held));
        $this->assertStringNotContainsString('maria@example.test', json_encode($held));
        $this->assertSame('4 players', $held['hold']['detail']);
        $this->assertSame('20:00', $held['hold']['ends_at']);
        $this->assertFalse($held['hold']['is_yours']);

        /* Both hours of the booking carry the same hold, so the grid merges
           them into one block, and the hour after it is free again. */
        $this->assertFalse($this->slotAt($slots, '19:00')['available']);
        $this->assertSame($held['hold']['key'], $this->slotAt($slots, '19:00')['hold']['key']);
        $this->assertTrue($this->slotAt($slots, '20:00')['available']);
        $this->assertNull($this->slotAt($slots, '20:00')['hold']);
    }

    public function test_a_player_sees_their_own_booking_as_theirs(): void
    {
        $court = $this->makeCourt();

        $player = Player::query()->create([
            'organization_id' => $this->organization->id,
            'name' => 'Juan Santos',
        ]);

        $this->book($court, '07:00', '08:00', ['player_id' => $player->id]);

        $slots = app(CourtAvailabilityService::class)->slots($court, today()->toDateString(), [$player->id]);
        $held = $this->slotAt($slots, '07:00');

        $this->assertSame('Your booking', $held['hold']['title']);
        $this->assertTrue($held['hold']['is_yours']);
    }

    public function test_a_session_is_named_by_what_it_is_rather_than_by_a_person(): void
    {
        $court = $this->makeCourt();

        $player = Player::query()->create([
            'organization_id' => $this->organization->id,
            'name' => 'Anne Lim',
        ]);

        $this->book($court, '20:00', '21:00', [
            'player_id' => $player->id,
            'reservation_type' => 'open_play',
        ]);

        $held = $this->slotAt(
            app(CourtAvailabilityService::class)->slots($court, today()->toDateString()),
            '20:00',
        );

        $this->assertSame('open_play', $held['status']);
        $this->assertSame('Open play', $held['hold']['title']);
        $this->assertStringContainsString('Drop-in session', $held['hold']['detail']);
        /* The organiser's name is not the point of a drop-in session. */
        $this->assertStringNotContainsString('Anne', json_encode($held));
    }

    public function test_a_maintenance_block_reads_as_a_block_not_a_booking(): void
    {
        $court = $this->makeCourt();

        CourtAvailabilityBlock::query()->create([
            'organization_id' => $court->organization_id,
            'branch_id' => $court->branch_id,
            'court_id' => $court->id,
            'block_date' => today()->toDateString(),
            'start_time' => '09:00',
            'end_time' => '10:00',
            'reason' => 'resurfacing',
        ]);

        $held = $this->slotAt(
            app(CourtAvailabilityService::class)->slots($court, today()->toDateString()),
            '09:00',
        );

        $this->assertSame('blocked', $held['status']);
        $this->assertSame('Resurfacing', $held['hold']['title']);
    }

    public function test_a_cancelled_booking_frees_the_slot_again(): void
    {
        $court = $this->makeCourt();

        $this->book($court, '12:00', '13:00', ['booking_status' => 'cancelled']);

        $slots = app(CourtAvailabilityService::class)->slots($court, today()->toDateString());

        $this->assertTrue($this->slotAt($slots, '12:00')['available']);
    }

    public function test_a_court_out_of_service_is_shut_for_the_whole_day(): void
    {
        $court = $this->makeCourt('maintenance');

        $slots = app(CourtAvailabilityService::class)->slots($court, today()->toDateString());

        $this->assertEmpty(collect($slots)->where('available', true));
        $this->assertSame('closed', $this->slotAt($slots, '06:00')['status']);
        $this->assertSame('Court closed', $this->slotAt($slots, '06:00')['hold']['title']);
    }

    /**
     * The day used to be read with two existence checks per half hour per
     * court, so a six court venue cost over four hundred queries to paint.
     */
    public function test_a_whole_venue_is_read_in_a_constant_number_of_queries(): void
    {
        $court = $this->makeCourt();

        $courts = collect([$court]);

        foreach (range(2, 6) as $number) {
            $courts->push(Court::query()->create([
                'organization_id' => $this->organization->id,
                'branch_id' => $this->branch->id,
                'name' => 'Court '.$number,
                'court_number' => $number,
                'status' => 'available',
                'standard_hourly_rate' => 500,
            ]));
        }

        DB::enableQueryLog();

        $days = app(CourtAvailabilityService::class)->slotsFor($courts, today()->toDateString());

        $queries = count(DB::getQueryLog());
        DB::disableQueryLog();

        $this->assertCount(6, $days);
        $this->assertLessThanOrEqual(3, $queries, 'The day should be read in a couple of queries, not one per slot.');
    }
}
