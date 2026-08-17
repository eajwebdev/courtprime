<?php

namespace App\Services;

use App\Models\Tournament;
use App\Models\TournamentBracketMatch;
use App\Models\TournamentDivision;
use App\Models\TournamentRegistration;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TournamentBracketService
{
    public function generate(Tournament $tournament, TournamentDivision $division, bool $overwrite = false): int
    {
        if ((int) $division->tournament_id !== (int) $tournament->id || (int) $division->organization_id !== (int) $tournament->organization_id) {
            throw ValidationException::withMessages(['tournament_division_id' => 'Choose a valid CourtPrime tournament division.']);
        }

        return DB::transaction(function () use ($tournament, $division, $overwrite) {
            $existingQuery = TournamentBracketMatch::query()
                ->where('tournament_division_id', $division->id);

            if ($existingQuery->exists() && ! $overwrite) {
                throw ValidationException::withMessages(['overwrite' => 'This division already has a bracket. Enable overwrite to regenerate it.']);
            }

            if ($overwrite) {
                $existingQuery->delete();
            }

            $registrations = TournamentRegistration::query()
                ->where('tournament_division_id', $division->id)
                ->whereIn('status', ['registered', 'checked_in'])
                ->with('playerProfile:id,global_rating,wins,global_match_count')
                ->get()
                ->sortBy([
                    fn (TournamentRegistration $registration) => $registration->seed ?: PHP_INT_MAX,
                    fn (TournamentRegistration $registration) => -1 * (float) ($registration->playerProfile?->global_rating ?? 0),
                    fn (TournamentRegistration $registration) => $registration->registered_at?->timestamp ?? 0,
                    fn (TournamentRegistration $registration) => $registration->id,
                ])
                ->values();

            if ($registrations->count() < 2) {
                throw ValidationException::withMessages(['tournament_division_id' => 'At least two registered teams are required to generate a bracket.']);
            }

            $registrations->each(function (TournamentRegistration $registration, int $index) {
                if (! $registration->seed) {
                    $registration->forceFill(['seed' => $index + 1])->save();
                }
            });

            $matchCount = (int) ceil($registrations->count() / 2);

            for ($index = 0; $index < $matchCount; $index++) {
                $teamOne = $registrations->get($index * 2);
                $teamTwo = $registrations->get(($index * 2) + 1);

                TournamentBracketMatch::query()->create([
                    'organization_id' => $tournament->organization_id,
                    'tournament_id' => $tournament->id,
                    'tournament_division_id' => $division->id,
                    'round_number' => 1,
                    'match_number' => $index + 1,
                    'bracket_position' => $index + 1,
                    'team_one_registration_id' => $teamOne?->id,
                    'team_two_registration_id' => $teamTwo?->id,
                    'winner_registration_id' => $teamTwo ? null : $teamOne?->id,
                    'status' => $teamTwo ? 'scheduled' : 'bye',
                    'metadata' => [
                        'generated_from' => 'registrations',
                        'format' => $tournament->format,
                    ],
                ]);
            }

            $division->forceFill(['status' => 'bracket_ready'])->save();

            return $matchCount;
        });
    }
}
