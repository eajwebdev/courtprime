<?php

namespace App\Services;

use App\Models\PlayerProfile;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Str;

class PlayerProfileResolver
{
    public function forUser(User $user): PlayerProfile
    {
        $profile = PlayerProfile::query()->where('user_id', $user->id)->first();

        if ($profile) {
            return $profile;
        }

        $profile = PlayerProfile::query()
            ->where('email', Str::lower($user->email))
            ->first();

        if ($profile) {
            $profile->update([
                'user_id' => $profile->user_id ?: $user->id,
                'verification_status' => $profile->verification_status === 'unverified' ? 'verified' : $profile->verification_status,
            ]);

            return $profile->refresh();
        }

        return $this->create($user);
    }

    private function create(User $user): PlayerProfile
    {
        [$firstName, $lastName] = $this->splitName($user->name);

        for ($attempt = 0; $attempt < 5; $attempt++) {
            try {
                return PlayerProfile::query()->create([
                    'user_id' => $user->id,
                    'courtprime_player_id' => $this->nextCourtPrimePlayerId($attempt),
                    'display_name' => $user->name,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => Str::lower($user->email),
                    'mobile_number' => $user->mobile_number,
                    'skill_level' => 'beginner',
                    'global_rating' => 2.50,
                    'privacy_settings' => [
                        'show_connected_clubs' => false,
                        'show_match_history' => true,
                        'show_rating' => true,
                        'show_city' => false,
                        'show_achievements' => true,
                    ],
                    'qr_token_version' => 1,
                    'qr_token_rotated_at' => now(),
                    'verification_status' => 'verified',
                    'status' => 'active',
                ]);
            } catch (QueryException $exception) {
                if ($attempt === 4) {
                    throw $exception;
                }
            }
        }

        throw new \RuntimeException('Unable to create CourtPrime player profile.');
    }

    private function nextCourtPrimePlayerId(int $offset = 0): string
    {
        $next = ((int) PlayerProfile::query()->max('id')) + 1 + $offset;

        return 'CP-PLY-'.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
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
