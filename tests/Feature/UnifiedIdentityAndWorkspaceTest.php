<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\CashierSession;
use App\Models\Organization;
use App\Models\OrganizationPlayer;
use App\Models\OrganizationUserRole;
use App\Models\Player;
use App\Models\PlayerProfile;
use App\Models\User;
use App\Services\PlayerIdentityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class UnifiedIdentityAndWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_one_global_player_profile_can_connect_to_multiple_organizations(): void
    {
        $metro = Organization::query()->create(['name' => 'Metro Pickle Club', 'slug' => 'metro']);
        $prime = Organization::query()->create(['name' => 'Prime Pickle Center', 'slug' => 'prime']);
        $player = PlayerProfile::query()->create([
            'courtprime_player_id' => 'CP-PLY-000001',
            'display_name' => 'Juan Santos',
            'email' => 'juan@example.test',
        ]);

        OrganizationPlayer::query()->create([
            'organization_id' => $metro->id,
            'player_profile_id' => $player->id,
            'local_player_number' => 'M-100',
            'organization_skill_level' => 'advanced',
        ]);

        OrganizationPlayer::query()->create([
            'organization_id' => $prime->id,
            'player_profile_id' => $player->id,
            'local_player_number' => 'P-550',
            'organization_skill_level' => 'intermediate',
        ]);

        $this->assertSame(1, PlayerProfile::query()->count());
        $this->assertSame(2, $player->organizationPlayers()->count());
    }

    public function test_users_can_only_switch_to_authorized_workspaces(): void
    {
        $metro = Organization::query()->create(['name' => 'Metro Pickle Club', 'slug' => 'metro']);
        $prime = Organization::query()->create(['name' => 'Prime Pickle Center', 'slug' => 'prime']);
        $branch = Branch::query()->create(['organization_id' => $prime->id, 'name' => 'Dumaguete', 'code' => 'DGT']);
        $user = User::factory()->create(['organization_id' => $metro->id, 'role_key' => 'organization_owner']);

        OrganizationUserRole::query()->create([
            'user_id' => $user->id,
            'organization_id' => $prime->id,
            'branch_id' => $branch->id,
            'role_key' => 'branch_manager',
            'is_primary' => true,
        ]);

        $this->actingAs($user)
            ->post('/workspace', ['organization_id' => $prime->id, 'branch_id' => $branch->id])
            ->assertRedirect();

        $this->assertSame($prime->id, session('courtprime.workspace.organization_id'));
        $this->assertSame($branch->id, session('courtprime.workspace.branch_id'));

        $blocked = Organization::query()->create(['name' => 'Blocked Club', 'slug' => 'blocked']);

        $this->actingAs($user)
            ->from('/dashboard')
            ->post('/workspace', ['organization_id' => $blocked->id])
            ->assertSessionHasErrors('organization_id');
    }

    public function test_player_directory_creates_global_profile_and_organization_relationship(): void
    {
        $organization = Organization::query()->create(['name' => 'Metro Pickle Club', 'slug' => 'metro']);
        $user = User::factory()->create(['organization_id' => $organization->id, 'role_key' => 'front_desk']);

        $this->actingAs($user)
            ->post('/players', [
                'name' => 'Juan Santos',
                'email' => 'juan@example.test',
                'mobile_number' => '+63 917 555 0001',
                'rating' => 4.21,
                'skill_level' => 'advanced',
                'membership_status' => 'active',
            ])
            ->assertRedirect();

        $profile = PlayerProfile::query()->firstOrFail();

        $this->assertSame('CP-PLY-000001', $profile->courtprime_player_id);
        $this->assertSame('Juan Santos', $profile->display_name);
        $this->assertDatabaseHas('organization_players', [
            'organization_id' => $organization->id,
            'player_profile_id' => $profile->id,
            'status' => 'active',
        ]);
        $this->assertDatabaseHas('players', [
            'organization_id' => $organization->id,
            'email' => 'juan@example.test',
        ]);
    }

    public function test_same_email_reuses_one_global_profile_across_organizations(): void
    {
        $metro = Organization::query()->create(['name' => 'Metro Pickle Club', 'slug' => 'metro']);
        $prime = Organization::query()->create(['name' => 'Prime Pickle Center', 'slug' => 'prime']);
        $service = app(PlayerIdentityService::class);

        $service->findOrCreateOrganizationPlayer($metro->id, [
            'name' => 'Juan Santos',
            'email' => 'juan@example.test',
            'rating' => 4.21,
            'skill_level' => 'advanced',
            'membership_status' => 'active',
        ]);

        $service->findOrCreateOrganizationPlayer($prime->id, [
            'name' => 'Juan Santos',
            'email' => 'juan@example.test',
            'rating' => 3.90,
            'skill_level' => 'intermediate',
            'membership_status' => 'guest',
        ]);

        $this->assertSame(1, PlayerProfile::query()->count());
        $this->assertSame(2, OrganizationPlayer::query()->withoutGlobalScope('organization')->count());
        $this->assertSame(2, Player::query()->withoutGlobalScope('organization')->count());
    }

    public function test_tenant_policy_denies_cross_organization_models(): void
    {
        $metro = Organization::query()->create(['name' => 'Metro Pickle Club', 'slug' => 'metro']);
        $prime = Organization::query()->create(['name' => 'Prime Pickle Center', 'slug' => 'prime']);
        $primeBranch = Branch::query()->create(['organization_id' => $prime->id, 'name' => 'Dumaguete', 'code' => 'DGT']);
        $user = User::factory()->create(['organization_id' => $metro->id, 'role_key' => 'organization_owner']);
        $session = CashierSession::query()->create([
            'organization_id' => $prime->id,
            'branch_id' => $primeBranch->id,
            'user_id' => $user->id,
            'reference' => 'TILL-DGT-TEST-0001',
            'status' => 'open',
            'opening_cash' => 1000,
            'expected_cash' => 1000,
            'opened_at' => now(),
        ]);

        $this->actingAs($user);

        $this->assertFalse(Gate::forUser($user)->allows('view', $session));
    }

    public function test_branch_scoped_users_cannot_mutate_another_branch_resource(): void
    {
        $organization = Organization::query()->create(['name' => 'Metro Pickle Club', 'slug' => 'metro']);
        $bacolod = Branch::query()->create(['organization_id' => $organization->id, 'name' => 'Bacolod', 'code' => 'BAC']);
        $cebu = Branch::query()->create(['organization_id' => $organization->id, 'name' => 'Cebu', 'code' => 'CEB']);
        $cashier = User::factory()->create([
            'organization_id' => $organization->id,
            'branch_id' => $bacolod->id,
            'role_key' => 'cashier',
        ]);
        $session = CashierSession::query()->create([
            'organization_id' => $organization->id,
            'branch_id' => $cebu->id,
            'user_id' => $cashier->id,
            'reference' => 'TILL-CEB-TEST-0001',
            'status' => 'open',
            'opening_cash' => 1000,
            'expected_cash' => 1000,
            'opened_at' => now(),
        ]);

        $this->actingAs($cashier)
            ->from('/cashier-sessions')
            ->post(route('cashier-sessions.close', $session, absolute: false), ['closing_cash' => 1000])
            ->assertForbidden();
    }

    public function test_superadmin_can_access_duplicate_identities_page(): void
    {
        $superadmin = User::factory()->create([
            'is_superadmin' => true,
        ]);

        $this->actingAs($superadmin)
            ->get(route('duplicate-identities.index'))
            ->assertOk();
    }

    public function test_non_superadmin_cannot_access_duplicate_identities_page(): void
    {
        $user = User::factory()->create([
            'is_superadmin' => false,
        ]);

        $this->actingAs($user)
            ->get(route('duplicate-identities.index'))
            ->assertForbidden();
    }
}

