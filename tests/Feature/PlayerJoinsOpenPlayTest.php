<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Court;
use App\Models\OpenPlayMatch;
use App\Models\OpenPlayQueueEntry;
use App\Models\OpenPlaySession;
use App\Models\OpenPlaySessionCourt;
use App\Models\Organization;
use App\Models\OrganizationPlayer;
use App\Models\Player;
use App\Models\PlayerProfile;
use App\Models\User;
use App\Services\MatchResultService;
use App\Services\PlayerProfileResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A registered player joining tonight's session with the ID and key.
 *
 * The point of joining as yourself rather than being typed in at the desk is
 * what happens after the game: results are credited to the network profile
 * behind the club-side player, so the win has to land on the account they
 * already have.
 */
class PlayerJoinsOpenPlayTest extends TestCase
{
    use RefreshDatabase;

    private function openPlaySession(): OpenPlaySession
    {
        $organization = Organization::query()->create([
            'name' => 'Join Club',
            'slug' => 'join-club',
            'status' => 'active',
            'timezone' => 'Asia/Manila',
            'currency' => 'PHP',
        ]);

        $branch = Branch::query()->create([
            'organization_id' => $organization->id,
            'name' => 'Main',
            'code' => 'JC-MAIN',
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

        $session = OpenPlaySession::query()->create([
            'organization_id' => $organization->id,
            'branch_id' => $branch->id,
            'name' => 'Tonight',
            'session_code' => 'OP-JOIN01',
            'session_key' => 'KEY123',
            'session_date' => today(),
            'start_time' => '18:00',
            'end_time' => '22:00',
            'status' => 'open',
            'current_round' => 0,
            'auto_rotate' => true,
        ]);

        OpenPlaySessionCourt::query()->create([
            'organization_id' => $organization->id,
            'open_play_session_id' => $session->id,
            'court_id' => $court->id,
        ]);

        return $session;
    }

    public function test_a_registered_player_joins_with_the_id_and_key(): void
    {
        $session = $this->openPlaySession();
        $user = User::factory()->create(['name' => 'Nina Cruz', 'email' => 'nina@example.test']);

        $this->actingAs($user)
            ->post('/me/open-play/join', ['code' => 'OP-JOIN01', 'key' => 'KEY123'])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        /* In the queue, waiting, as themselves. */
        $entry = OpenPlayQueueEntry::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->firstOrFail();

        $this->assertSame(OpenPlayQueueEntry::WAITING, $entry->status);

        $player = Player::query()->withoutGlobalScope('organization')->findOrFail($entry->player_id);
        $this->assertSame('Nina Cruz', $player->name);

        /* And wired to the account they already had, which is what makes a win
           land on their record rather than on a stranger with the same name. */
        $link = OrganizationPlayer::query()
            ->withoutGlobalScope('organization')
            ->where('legacy_player_id', $player->id)
            ->firstOrFail();

        $profile = PlayerProfile::query()->findOrFail($link->player_profile_id);
        $this->assertSame($user->id, $profile->user_id);
    }

    /** The pair is the door. A wrong key does not put anybody in the rotation. */
    public function test_a_wrong_key_joins_nobody(): void
    {
        $session = $this->openPlaySession();
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/me/open-play/join', ['code' => 'OP-JOIN01', 'key' => 'WRONG'])
            ->assertSessionHasErrors('code');

        $this->assertSame(0, $session->queue()->withoutGlobalScope('organization')->count());
    }

    /** An ended session is not a way in, for players either. */
    public function test_an_ended_session_cannot_be_joined(): void
    {
        $session = $this->openPlaySession();
        $session->update(['status' => 'completed']);

        $this->actingAs(User::factory()->create())
            ->post('/me/open-play/join', ['code' => 'OP-JOIN01', 'key' => 'KEY123'])
            ->assertSessionHasErrors('code');

        $this->assertSame(0, $session->queue()->withoutGlobalScope('organization')->count());
    }

    /** Tapping join twice does not take two places in the queue. */
    public function test_joining_twice_is_harmless(): void
    {
        $session = $this->openPlaySession();
        $user = User::factory()->create();

        foreach (range(1, 3) as $ignored) {
            $this->actingAs($user)->post('/me/open-play/join', ['code' => 'OP-JOIN01', 'key' => 'KEY123']);
        }

        $this->assertSame(1, $session->queue()->withoutGlobalScope('organization')->count());
        $this->assertSame(1, $session->players()->withoutGlobalScope('organization')->count());
    }

    /**
     * The reason any of this matters: winning a game they joined themselves
     * shows up on their own record, which is what the rankings read.
     */
    public function test_winning_after_joining_is_credited_to_their_profile(): void
    {
        $session = $this->openPlaySession();

        $user = User::factory()->create(['name' => 'Nina Cruz', 'email' => 'nina@example.test']);
        $profile = app(PlayerProfileResolver::class)->forUser($user);

        $this->assertSame(0, (int) $profile->wins);

        $this->actingAs($user)->post('/me/open-play/join', ['code' => 'OP-JOIN01', 'key' => 'KEY123']);

        $entry = OpenPlayQueueEntry::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->firstOrFail();

        /* A finished game they were on the winning side of. */
        $match = OpenPlayMatch::query()->create([
            'organization_id' => $session->organization_id,
            'open_play_session_id' => $session->id,
            'court_id' => $session->courts()->first()->id,
            'round' => 1,
            'status' => 'completed',
            'winner_team' => 'one',
        ]);

        $match->participants()->create([
            'organization_id' => $session->organization_id,
            'player_id' => $entry->player_id,
            'team' => 'one',
        ]);

        app(MatchResultService::class)->recordOpenPlay($match);

        $profile->refresh();

        $this->assertSame(1, (int) $profile->wins);
        $this->assertSame(1, (int) $profile->global_match_count);
        $this->assertSame(0, (int) $profile->losses);
    }
}
