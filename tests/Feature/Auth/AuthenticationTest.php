<?php

namespace Tests\Feature\Auth;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered()
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    /**
     * Signing in lands you where your job is.
     *
     * This asserted the dashboard for everybody, which is only the fallback
     * for a role with no home of its own — so it failed for the default user,
     * a player, who is sent to their own portal. Pinning the actual mapping is
     * worth more than pinning the fallback.
     */
    public function test_users_can_authenticate_using_the_login_screen()
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        /* The factory's default role is player. */
        $response->assertRedirect(route('me', absolute: false));
    }

    public function test_each_role_lands_on_its_own_home(): void
    {
        $organization = Organization::query()->create([
            'name' => 'Home Club',
            'slug' => 'home-club',
            'status' => 'active',
            'timezone' => 'Asia/Manila',
            'currency' => 'PHP',
        ]);

        $homes = [
            'cashier' => '/pos',
            'front_desk' => '/operations',
            'scorekeeper' => '/live-courts',
            'tournament_director' => '/tournaments',
            'organization_owner' => '/dashboard',
        ];

        foreach ($homes as $role => $home) {
            $user = User::factory()->create([
                'organization_id' => $organization->id,
                'role_key' => $role,
            ]);

            $this->post('/login', ['email' => $user->email, 'password' => 'password'])
                ->assertRedirect($home);

            $this->post('/logout');
        }
    }

    public function test_users_can_not_authenticate_with_invalid_password()
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }
}
