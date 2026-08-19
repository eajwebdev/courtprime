<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Court;
use App\Models\Organization;
use App\Models\Reservation;
use App\Models\User;
use App\Services\CourtAvailabilityService;
use App\Support\NetworkClock;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * The three rules a player booking obeys.
 *
 * Courts are sold by the hour, on the hour; the earliest day is tomorrow; and
 * one booking runs at most four hours. The grid will not offer anything else,
 * but a form post is a form post — these prove the server refuses it too.
 */
class PlayerBookingRulesTest extends TestCase
{
    use RefreshDatabase;

    private function makeCourt(): Court
    {
        $organization = Organization::query()->create([
            'name' => 'Rules Club',
            'slug' => 'rules-club',
            'status' => 'active',
            'timezone' => 'Asia/Manila',
            'currency' => 'PHP',
        ]);

        $branch = Branch::query()->create([
            'organization_id' => $organization->id,
            'name' => 'Main',
            'code' => 'RC-MAIN',
            'status' => 'active',
            'tax_rate' => 12,
        ]);

        return Court::query()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'name' => 'Court 1',
            'court_number' => 1,
            'status' => 'available',
            'standard_hourly_rate' => 650,
        ]);
    }

    private function book(Court $court, array $overrides = []): TestResponse
    {
        return $this->actingAs(User::factory()->create())->post('/me/book', [
            'court_id' => $court->id,
            'reservation_date' => NetworkClock::firstBookableDate(),
            'start_time' => '18:00',
            'end_time' => '19:00',
            'players_count' => 4,
            ...$overrides,
        ]);
    }

    public function test_an_hour_on_the_hour_from_tomorrow_is_accepted(): void
    {
        $court = $this->makeCourt();

        $this->book($court)->assertSessionHasNoErrors();

        /* Through the model, so the date cast is what gets compared rather than
           whatever shape the driver happens to store a date column in. */
        $reservation = Reservation::query()->withoutGlobalScope('organization')->firstOrFail();

        $this->assertSame($court->id, $reservation->court_id);
        $this->assertSame(NetworkClock::firstBookableDate(), $reservation->reservation_date->toDateString());
        $this->assertSame(60, $reservation->duration_minutes);
    }

    public function test_today_cannot_be_booked(): void
    {
        $court = $this->makeCourt();

        $this->book($court, ['reservation_date' => NetworkClock::today()])
            ->assertSessionHasErrors('reservation_date');

        $this->assertDatabaseCount('reservations', 0);
    }

    public function test_a_half_hour_booking_is_refused(): void
    {
        $court = $this->makeCourt();

        /* Ends on the half hour. */
        $this->book($court, ['end_time' => '18:30'])->assertSessionHasErrors('end_time');

        /* Starts on the half hour. */
        $this->book($court, ['start_time' => '18:30', 'end_time' => '19:30'])
            ->assertSessionHasErrors('start_time');

        $this->assertDatabaseCount('reservations', 0);
    }

    public function test_a_booking_longer_than_four_hours_is_refused(): void
    {
        $court = $this->makeCourt();

        $this->book($court, ['start_time' => '14:00', 'end_time' => '19:00'])
            ->assertSessionHasErrors('end_time');

        $this->assertDatabaseCount('reservations', 0);
    }

    public function test_exactly_four_hours_is_accepted(): void
    {
        $court = $this->makeCourt();

        $this->book($court, ['start_time' => '14:00', 'end_time' => '18:00'])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('reservations', ['duration_minutes' => 240]);
    }

    public function test_the_day_is_offered_in_whole_hours(): void
    {
        $court = $this->makeCourt();

        $slots = app(CourtAvailabilityService::class)->slots($court, NetworkClock::firstBookableDate());

        $this->assertCount(CourtAvailabilityService::CLOSES_AT - CourtAvailabilityService::OPENS_AT, $slots);

        foreach ($slots as $slot) {
            $this->assertStringEndsWith(':00', $slot['start_time']);
            $this->assertStringEndsWith(':00', $slot['end_time']);
        }

        $this->assertSame('06:00', $slots[0]['start_time']);
        $this->assertSame('07:00', $slots[0]['end_time']);
        $this->assertSame('22:00', end($slots)['start_time']);
    }

    /** The grid opens on a day it can actually sell, not on today. */
    public function test_the_booking_page_opens_on_the_first_bookable_day(): void
    {
        $this->makeCourt();

        $this->get('/me/book')->assertInertia(
            fn ($page) => $page->where('date', NetworkClock::firstBookableDate())
                ->where('firstBookableDate', NetworkClock::firstBookableDate()),
        );
    }

    /** A stale link to today is pulled forward rather than rendered dead. */
    public function test_a_link_to_an_earlier_day_lands_on_the_first_bookable_day(): void
    {
        $this->makeCourt();

        $this->get('/me/book?date='.NetworkClock::today())->assertInertia(
            fn ($page) => $page->where('date', NetworkClock::firstBookableDate()),
        );
    }
}
