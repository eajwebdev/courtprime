<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Organization;
use App\Models\Player;
use App\Models\User;
use App\Services\PlayerIdentityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * What the landing page claims about the network.
 *
 * These are the only numbers a stranger sees, so they have to mean what they
 * say. "Registered players" means people who signed themselves up — not
 * everybody a club has ever typed into an open play board.
 */
class LandingNetworkStatsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        /* The stats are cached for ten minutes on a public page. */
        Cache::forget('landing.network_stats');
    }

    /** @return array<string, int> */
    private function stats(): array
    {
        $response = $this->get('/');
        $response->assertOk();

        return collect($response->viewData('page')['props']['networkStats'])
            ->mapWithKeys(fn (array $stat) => [$stat['key'] => $stat['value']])
            ->all();
    }

    private function club(): Organization
    {
        $organization = Organization::query()->create([
            'name' => 'Stats Club',
            'slug' => 'stats-club',
            'status' => 'active',
            'timezone' => 'Asia/Manila',
            'currency' => 'PHP',
        ]);

        Branch::query()->create([
            'organization_id' => $organization->id,
            'name' => 'Main',
            'code' => 'SC-MAIN',
            'status' => 'active',
        ]);

        return $organization;
    }

    public function test_a_walk_in_added_at_the_board_is_not_a_registered_player(): void
    {
        $organization = $this->club();

        /* Exactly what the open play board does when somebody types a name. */
        app(PlayerIdentityService::class)->findOrCreateLocalPlayer($organization->id, ['name' => 'Walk In']);

        $this->assertSame(1, Player::query()->withoutGlobalScope('organization')->count());

        /* Nobody registered, so the tile is absent rather than reading zero. */
        $this->assertArrayNotHasKey('players', $this->stats());
    }

    public function test_someone_who_registers_is_counted(): void
    {
        $this->club();

        $this->post('/register', [
            'name' => 'Real Person',
            'email' => 'real@example.test',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        Cache::forget('landing.network_stats');

        $this->assertSame(1, $this->stats()['players'] ?? 0);
    }

    /** Staff a club creates did not register themselves. */
    public function test_club_staff_are_not_counted_as_registered_players(): void
    {
        $organization = $this->club();

        User::factory()->create(['organization_id' => $organization->id, 'role_key' => 'organization_owner']);
        User::factory()->create(['organization_id' => $organization->id, 'role_key' => 'front_desk']);

        $this->assertArrayNotHasKey('players', $this->stats());
    }

    /** A number nobody has yet is left off rather than advertised as zero. */
    public function test_a_stat_with_nothing_behind_it_is_not_shown(): void
    {
        $stats = $this->stats();

        foreach ($stats as $key => $value) {
            $this->assertGreaterThan(0, $value, "The {$key} tile is showing zero.");
        }
    }
}
