<?php

namespace App\Services;

use App\Models\OpenPlayPlayer;
use App\Models\OpenPlayQueueEntry;
use App\Models\OpenPlaySession;
use App\Models\Player;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OpenPlayService
{
    /**
     * Generate a short, unambiguous session code.
     *
     * No I, O, 0 or 1 — these get read aloud across a noisy court and typed by
     * someone holding a paddle.
     */
    public function generateCode(int $organizationId, ?string $preferred = null): string
    {
        $preferred = strtoupper(trim((string) $preferred));

        if ($preferred !== '' && ! $this->codeTaken($organizationId, $preferred)) {
            return $preferred;
        }

        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

        do {
            $code = 'OP-'.collect(range(1, 6))->map(fn () => $alphabet[random_int(0, strlen($alphabet) - 1)])->implode('');
        } while ($this->codeTaken($organizationId, $code));

        return $code;
    }

    private function codeTaken(int $organizationId, string $code): bool
    {
        return OpenPlaySession::query()
            ->withoutGlobalScope('organization')
            ->where('organization_id', $organizationId)
            ->where('session_code', $code)
            ->exists();
    }

    /** Session keys are read aloud and typed in a hurry, so no ambiguous glyphs. */
    public function generateKey(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

        return collect(range(1, 6))->map(fn () => $alphabet[random_int(0, strlen($alphabet) - 1)])->implode('');
    }

    /**
     * Find an open session by its ID and key.
     *
     * Both halves are required. The code identifies the session and is on a
     * screen at the club; the key is the secret the club hands out, so knowing
     * one is not enough to walk into someone else's session.
     *
     * Deliberately scope-free: a player belongs to the network, not to the club
     * whose credentials they were given.
     */
    public function sessionForCode(string $code, ?string $key = null): OpenPlaySession
    {
        $session = OpenPlaySession::query()
            ->withoutGlobalScope('organization')
            ->with('branch.organization')
            ->where('session_code', strtoupper(trim($code)))
            ->whereIn('status', ['scheduled', 'open', 'live'])
            ->first();

        /*
         * One message for both failures. Telling someone the ID was right but
         * the key was wrong confirms the session exists and turns guessing the
         * key into a solvable problem.
         */
        $wrong = fn () => ValidationException::withMessages([
            'code' => 'That session ID and key do not match an open session. Check them with the club.',
        ]);

        if (! $session) {
            throw $wrong();
        }

        if ($session->session_key) {
            if ($key === null || ! hash_equals($session->session_key, strtoupper(trim($key)))) {
                throw $wrong();
            }
        }

        return $session;
    }

    public function join(OpenPlaySession $session, Player $player): OpenPlayPlayer
    {
        return DB::transaction(function () use ($session, $player) {
            $entry = OpenPlayPlayer::query()->updateOrCreate(
                ['open_play_session_id' => $session->id, 'player_id' => $player->id],
                [
                    'organization_id' => $session->organization_id,
                    'status' => 'registered',
                    'withdrawn_at' => null,
                ],
            );

            OpenPlayQueueEntry::query()->updateOrCreate(
                ['open_play_session_id' => $session->id, 'player_id' => $player->id],
                [
                    'organization_id' => $session->organization_id,
                    'position' => OpenPlayQueueEntry::query()->where('open_play_session_id', $session->id)->max('position') + 1,
                    'status' => 'waiting',
                ],
            );

            return $entry;
        });
    }

    public function checkIn(OpenPlaySession $session, Player $player): void
    {
        OpenPlayPlayer::query()
            ->where('open_play_session_id', $session->id)
            ->where('player_id', $player->id)
            ->update(['status' => 'checked_in', 'checked_in_at' => now()]);
    }

    public function recommendGroup(OpenPlaySession $session, int $size = 4, string $mode = 'skill_based'): array
    {
        $entries = $this->candidateEntries($session, $size);

        if ($mode === 'random') {
            return $entries->shuffle()->take($size)->values()->all();
        }

        if (in_array($mode, ['queue_priority', 'winner_stays'], true)) {
            return $entries->take($size)->values()->all();
        }

        $average = $entries->avg(fn (OpenPlayQueueEntry $entry) => (float) $entry->player->rating) ?: 0;

        return $entries
            ->sortBy(fn (OpenPlayQueueEntry $entry) => abs((float) $entry->player->rating - $average))
            ->take($size)
            ->values()
            ->all();
    }

    public function buildGroup(OpenPlaySession $session, int $size = 4, string $mode = 'skill_based', ?int $courtId = null, array $playerIds = []): array
    {
        return DB::transaction(function () use ($session, $size, $mode, $courtId, $playerIds) {
            $entries = $mode === 'manual'
                ? $this->manualEntries($session, $playerIds)
                : collect($this->recommendGroup($session, $size, $mode));

            $entries = $entries->take($size)->values();

            foreach ($entries as $entry) {
                $entry->update([
                    'status' => 'called',
                    'assigned_court_id' => $courtId,
                    'called_at' => now(),
                ]);

                OpenPlayPlayer::query()
                    ->where('open_play_session_id', $session->id)
                    ->where('player_id', $entry->player_id)
                    ->update(['status' => 'playing']);
            }

            $this->resequenceQueue($session);

            return $entries->map(fn (OpenPlayQueueEntry $entry) => $entry->load(['player', 'court']))->all();
        });
    }

    private function candidateEntries(OpenPlaySession $session, int $size): Collection
    {
        return OpenPlayQueueEntry::query()
            ->with('player')
            ->where('open_play_session_id', $session->id)
            ->where('status', 'waiting')
            ->orderBy('position')
            ->limit(max($size * 2, $size))
            ->get();
    }

    private function manualEntries(OpenPlaySession $session, array $playerIds): Collection
    {
        return OpenPlayQueueEntry::query()
            ->with('player')
            ->where('open_play_session_id', $session->id)
            ->where('status', 'waiting')
            ->whereIn('player_id', $playerIds)
            ->orderBy('position')
            ->get();
    }

    private function resequenceQueue(OpenPlaySession $session): void
    {
        OpenPlayQueueEntry::query()
            ->where('open_play_session_id', $session->id)
            ->where('status', 'waiting')
            ->orderBy('position')
            ->get()
            ->each(fn (OpenPlayQueueEntry $entry, int $index) => $entry->update(['position' => $index + 1]));
    }
}
