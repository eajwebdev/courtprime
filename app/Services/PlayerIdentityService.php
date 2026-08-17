<?php

namespace App\Services;

use App\Models\OrganizationPlayer;
use App\Models\Player;
use App\Models\PlayerProfile;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PlayerIdentityService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function findOrCreateLocalPlayer(int $organizationId, array $data): Player
    {
        return $this->findOrCreateOrganizationPlayer($organizationId, $data)->legacyPlayer;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function findOrCreateOrganizationPlayer(int $organizationId, array $data): OrganizationPlayer
    {
        return DB::transaction(function () use ($organizationId, $data) {
            $profile = $this->findOrCreateProfile($data);
            $legacyPlayer = $this->findOrCreateLegacyPlayer($organizationId, $profile, $data);

            $organizationPlayer = OrganizationPlayer::query()
                ->withoutGlobalScope('organization')
                ->firstOrNew([
                    'organization_id' => $organizationId,
                    'player_profile_id' => $profile->id,
                ]);

            $organizationPlayer->fill([
                'legacy_player_id' => $legacyPlayer->id,
                'organization_skill_level' => $this->skillLevel($data),
                'home_branch_id' => $data['home_branch_id'] ?? null,
                'status' => $this->membershipStatus($data),
                'wallet_balance' => $organizationPlayer->wallet_balance ?? $legacyPlayer->wallet_balance ?? 0,
                'first_visit_at' => $organizationPlayer->exists ? $organizationPlayer->first_visit_at : now(),
                'last_visit_at' => now(),
                'preferences' => $data['preferences'] ?? null,
            ]);

            if (! $organizationPlayer->local_player_number) {
                $organizationPlayer->local_player_number = $this->nextLocalPlayerNumber($organizationId);
            }

            $organizationPlayer->save();

            return $organizationPlayer->load(['playerProfile', 'legacyPlayer']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function findOrCreateProfile(array $data): PlayerProfile
    {
        $email = $this->email($data);
        $mobileNumber = $this->mobileNumber($data);

        $profile = null;

        if ($email || $mobileNumber) {
            $profile = PlayerProfile::query()
                ->where(function ($query) use ($email, $mobileNumber) {
                    $query
                        ->when($email, fn ($query) => $query->orWhere('email', $email))
                        ->when($mobileNumber, fn ($query) => $query->orWhere('mobile_number', $mobileNumber));
                })
                ->first();
        }

        if ($profile) {
            $profile->fill([
                'display_name' => $profile->display_name ?: $this->name($data),
                'email' => $profile->email ?: $email,
                'mobile_number' => $profile->mobile_number ?: $mobileNumber,
                'skill_level' => $this->skillLevel($data),
            ])->save();

            return $profile;
        }

        return $this->createProfile($data, $email, $mobileNumber);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function createProfile(array $data, ?string $email, ?string $mobileNumber): PlayerProfile
    {
        $name = $this->name($data);
        [$firstName, $lastName] = $this->splitName($name);

        for ($attempt = 0; $attempt < 5; $attempt++) {
            try {
                return PlayerProfile::query()->create([
                    'courtprime_player_id' => $this->nextCourtPrimePlayerId($attempt),
                    'display_name' => $name,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $email,
                    'mobile_number' => $mobileNumber,
                    'birthday' => $data['birthdate'] ?? $data['birthday'] ?? null,
                    'skill_level' => $this->skillLevel($data),
                    'global_rating' => $data['rating'] ?? 2.50,
                    'privacy_settings' => [
                        'show_connected_clubs' => false,
                        'show_match_history' => true,
                    ],
                    'qr_token_version' => 1,
                    'qr_token_rotated_at' => now(),
                    'verification_status' => 'unverified',
                    'status' => 'active',
                ]);
            } catch (QueryException $exception) {
                if ($attempt === 4) {
                    throw $exception;
                }
            }
        }

        throw new \RuntimeException('Unable to create CourtPrime player identity.');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function findOrCreateLegacyPlayer(int $organizationId, PlayerProfile $profile, array $data): Player
    {
        $email = $this->email($data) ?? $profile->email;
        $mobileNumber = $this->mobileNumber($data) ?? $profile->mobile_number;

        $query = Player::query()->withoutGlobalScope('organization')->where('organization_id', $organizationId);

        if ($email) {
            $query->where('email', $email);
        } elseif ($mobileNumber) {
            $query->where('mobile_number', $mobileNumber);
        } else {
            $query->where('name', $profile->display_name);
        }

        $player = $query->first();

        if (! $player) {
            $player = new Player(['organization_id' => $organizationId]);
        }

        $player->fill([
            'user_id' => $profile->user_id,
            'name' => $profile->display_name,
            'email' => $email,
            'mobile_number' => $mobileNumber,
            'emergency_contact' => $data['emergency_contact'] ?? $player->emergency_contact,
            'birthdate' => $data['birthdate'] ?? $profile->birthday ?? $player->birthdate,
            'rating' => $data['rating'] ?? $profile->global_rating ?? $player->rating ?? 2.50,
            'skill_level' => $this->skillLevel($data),
            'membership_status' => $this->membershipStatus($data),
            'preferences' => $data['preferences'] ?? $player->preferences,
        ]);

        $player->save();

        return $player;
    }

    private function nextCourtPrimePlayerId(int $offset = 0): string
    {
        $next = ((int) PlayerProfile::query()->max('id')) + 1 + $offset;

        return 'CP-PLY-'.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }

    private function nextLocalPlayerNumber(int $organizationId): string
    {
        $next = OrganizationPlayer::query()
            ->withoutGlobalScope('organization')
            ->where('organization_id', $organizationId)
            ->count() + 1;

        return 'LOC-'.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function name(array $data): string
    {
        return trim((string) ($data['name'] ?? $data['player_name'] ?? 'CourtPrime Player'));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function email(array $data): ?string
    {
        $email = $data['email'] ?? $data['player_email'] ?? null;

        return $email ? Str::lower(trim((string) $email)) : null;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function mobileNumber(array $data): ?string
    {
        $mobileNumber = $data['mobile_number'] ?? $data['player_mobile_number'] ?? null;

        return $mobileNumber ? trim((string) $mobileNumber) : null;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function skillLevel(array $data): string
    {
        return (string) ($data['skill_level'] ?? 'beginner');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function membershipStatus(array $data): string
    {
        return (string) ($data['membership_status'] ?? 'guest');
    }

    /**
     * @return array{0: string|null, 1: string|null}
     */
    private function splitName(string $name): array
    {
        $parts = preg_split('/\s+/', trim($name), 2) ?: [];

        return [$parts[0] ?? null, $parts[1] ?? null];
    }
}
