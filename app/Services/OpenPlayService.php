<?php

namespace App\Services;

use App\Models\OpenPlayPlayer;
use App\Models\OpenPlayQueueEntry;
use App\Models\OpenPlaySession;
use App\Models\Player;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class OpenPlayService
{
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
