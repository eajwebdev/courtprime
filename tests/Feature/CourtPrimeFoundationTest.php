<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Court;
use App\Models\CourtAvailabilityBlock;
use App\Models\DemoRequest;
use App\Models\Organization;
use App\Models\Reservation;
use App\Models\ReservationLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourtPrimeFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_records_are_scoped_to_the_authenticated_organization(): void
    {
        $organizationA = Organization::query()->create(['name' => 'Club A', 'slug' => 'club-a']);
        $organizationB = Organization::query()->create(['name' => 'Club B', 'slug' => 'club-b']);

        Branch::query()->create(['organization_id' => $organizationA->id, 'name' => 'A Branch', 'code' => 'A']);
        Branch::query()->create(['organization_id' => $organizationB->id, 'name' => 'B Branch', 'code' => 'B']);

        $user = User::factory()->create(['organization_id' => $organizationA->id, 'role_key' => 'organization_owner']);

        $this->actingAs($user);

        $this->assertSame(['A Branch'], Branch::query()->pluck('name')->all());
    }

    public function test_public_demo_requests_are_stored_with_a_reference(): void
    {
        $response = $this->post('/request-demo', [
            'business_name' => 'Metro Pickle Club',
            'contact_person' => 'Nina Villanueva',
            'email' => 'nina@example.test',
            'mobile_number' => '+63 917 555 2291',
            'branches_count' => 3,
            'courts_count' => 14,
            'features_needed' => ['Court Reservation', 'POS', 'Live Scoring'],
            'demo_preference' => 'google_meet',
        ]);

        $request = DemoRequest::query()->firstOrFail();

        $response->assertRedirect(route('demo.requested', $request, absolute: false));
        $this->assertSame('DEMO-'.now()->year.'-000001', $request->reference);
        $this->assertSame(['Court Reservation', 'POS', 'Live Scoring'], $request->features_needed);
    }

    public function test_reservation_engine_prevents_overlapping_bookings(): void
    {
        $organization = Organization::query()->create(['name' => 'EAJ Club', 'slug' => 'eaj-club']);
        $branch = Branch::query()->create(['organization_id' => $organization->id, 'name' => 'Bacolod', 'code' => 'BAC', 'tax_rate' => 12]);
        $court = Court::query()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'name' => 'Court 1',
            'court_number' => 1,
            'standard_hourly_rate' => 600,
            'peak_hourly_rate' => 800,
            'member_hourly_rate' => 500,
            'status' => 'available',
        ]);
        $user = User::factory()->create(['organization_id' => $organization->id, 'role_key' => 'front_desk']);

        $payload = [
            'court_id' => $court->id,
            'player_name' => 'Juan Santos',
            'player_email' => 'juan@example.test',
            'reservation_date' => now()->toDateString(),
            'start_time' => '18:00',
            'end_time' => '19:00',
            'players_count' => 4,
        ];

        $this->actingAs($user)->post('/reservations', $payload)->assertRedirect();
        $this->actingAs($user)->from('/reservations')->post('/reservations', [
            ...$payload,
            'player_email' => 'maria@example.test',
        ])->assertSessionHasErrors('court_id');
    }

    public function test_court_availability_blocks_prevent_booking(): void
    {
        $organization = Organization::query()->create(['name' => 'EAJ Club', 'slug' => 'eaj-club']);
        $branch = Branch::query()->create(['organization_id' => $organization->id, 'name' => 'Bacolod', 'code' => 'BAC', 'tax_rate' => 12]);
        $court = Court::query()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'name' => 'Court 1',
            'court_number' => 1,
            'standard_hourly_rate' => 600,
            'status' => 'available',
        ]);
        $user = User::factory()->create(['organization_id' => $organization->id, 'role_key' => 'front_desk']);

        CourtAvailabilityBlock::query()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'court_id' => $court->id,
            'block_date' => now()->toDateString(),
            'start_time' => '13:00',
            'end_time' => '15:00',
            'reason' => 'maintenance',
        ]);

        $this->actingAs($user)->from('/reservations')->post('/reservations', [
            'court_id' => $court->id,
            'player_name' => 'Anne Lim',
            'player_email' => 'anne@example.test',
            'reservation_date' => now()->toDateString(),
            'start_time' => '14:00',
            'end_time' => '15:00',
            'players_count' => 4,
        ])->assertSessionHasErrors('court_id');
    }

    public function test_check_in_lifecycle_updates_reservation_and_logs_action(): void
    {
        $organization = Organization::query()->create(['name' => 'EAJ Club', 'slug' => 'eaj-club']);
        $branch = Branch::query()->create(['organization_id' => $organization->id, 'name' => 'Bacolod', 'code' => 'BAC']);
        $court = Court::query()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'name' => 'Court 1',
            'court_number' => 1,
            'standard_hourly_rate' => 600,
            'status' => 'available',
        ]);
        $user = User::factory()->create(['organization_id' => $organization->id, 'role_key' => 'front_desk']);
        $reservation = Reservation::query()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'court_id' => $court->id,
            'reference' => 'RSV-BAC-TEST-0001',
            'reservation_date' => today(),
            'start_time' => '18:00',
            'end_time' => '19:00',
            'duration_minutes' => 60,
            'players_count' => 4,
            'amount_due' => 672,
            'booking_status' => 'confirmed',
        ]);

        $this->actingAs($user)->post(route('check-in.store', $reservation, absolute: false))->assertRedirect();

        $reservation->refresh();

        $this->assertSame('checked_in', $reservation->booking_status);
        $this->assertNotNull($reservation->checked_in_at);
        $this->assertSame($user->id, $reservation->checked_in_by);
        $this->assertTrue(ReservationLog::query()->where('reservation_id', $reservation->id)->where('action', 'checked_in')->exists());
    }
}
