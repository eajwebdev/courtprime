<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $this->actingAs($user = User::factory()->create());

        $this->get('/dashboard')->assertOk();
    }

    public function test_cashier_receives_cashier_dashboard_mode()
    {
        $organization = Organization::query()->create(['name' => 'CourtPrime Club', 'slug' => 'courtprime-club']);
        $branch = Branch::query()->create(['organization_id' => $organization->id, 'name' => 'Main Branch', 'code' => 'MAIN']);
        $cashier = User::factory()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'role_key' => 'cashier',
        ]);

        $this->actingAs($cashier)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('mode', 'cashier')
                ->where('role', 'cashier')
            );
    }

    public function test_scorekeeper_receives_sports_dashboard_mode()
    {
        $organization = Organization::query()->create(['name' => 'CourtPrime Club', 'slug' => 'courtprime-club']);
        $branch = Branch::query()->create(['organization_id' => $organization->id, 'name' => 'Main Branch', 'code' => 'MAIN']);
        $scorekeeper = User::factory()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'role_key' => 'scorekeeper',
        ]);

        $this->actingAs($scorekeeper)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('mode', 'sports')
                ->where('role', 'scorekeeper')
            );
    }
}
