<?php

namespace App\Services;

use App\Models\OpenPlayMatch;
use App\Models\OpenPlayPlayer;
use App\Models\OpenPlayQueueEntry;
use App\Models\OpenPlaySession;
use Illuminate\Support\Collection;

/**
 * The paddle stack.
 *
 * A real stack rotates out only as many players as there are people waiting to
 * replace them. Four waiting means the court clears; one waiting means one
 * player comes off and three carry on. The rotation used to empty the court
 * after every game and refill it from the whole pool, which is the same thing
 * only when the queue happens to be long — and wrong the rest of the time.
 *
 * Two rules keep it fair, and they are in tension:
 *
 *   · FIFO. Whoever has waited longest goes on next, always. Players coming off
 *     a court join the back of the queue behind everyone already stood there,
 *     never in front of them.
 *   · Nobody camps. When fewer come off than are on, the ones who come off are
 *     those who have played the most games back to back.
 *
 * This class only decides. Creating the next match, scoring and pairing stay in
 * OpenPlayRotationService, which calls this.
 */
class PaddleStackService
{
    /** Two for singles, four for doubles. */
    public function capacity(OpenPlaySession $session): int
    {
        return $session->format === 'singles' ? 2 : 4;
    }

    /** Below this a court cannot start at all. */
    public function minimumToStart(OpenPlaySession $session): int
    {
        return $this->capacity($session);
    }

    /**
     * Who comes off and who goes on when a game finishes.
     *
     * `stay` and `out` together are always the players who were on the court;
     * `in` comes off the front of the queue. `in` and `out` are always the same
     * length, because a court holds what a court holds.
     *
     * @param  array<int, int>  $onCourt  Player ids that just finished.
     * @return array{stay: array<int,int>, out: array<int,int>, in: array<int,int>}
     */
    public function plan(OpenPlaySession $session, array $onCourt): array
    {
        $capacity = $this->capacity($session);
        $waiting = $this->waitingQueue($session, $onCourt);

        /*
         * As many come off as can be replaced, and never more than are on. A
         * queue of one rotates one; a queue of ten still only rotates a court's
         * worth, because the eleventh player has nowhere to stand.
         */
        $rotating = min($waiting->count(), count($onCourt), $capacity);

        if ($rotating === 0) {
            /* Nobody waiting: the same players carry on. */
            return ['stay' => array_values($onCourt), 'out' => [], 'in' => []];
        }

        $out = $this->chooseWhoComesOff($session, $onCourt, $rotating);
        $stay = array_values(array_diff($onCourt, $out));
        $in = $waiting->take($rotating)->pluck('player_id')->map(fn ($id) => (int) $id)->all();

        return ['stay' => $stay, 'out' => $out, 'in' => $in];
    }

    /**
     * The waiting queue, in the order it will be served.
     *
     * Strictly FIFO on when the wait began, with the stored position as the
     * tie-breaker for players enqueued in the same second — which is exactly
     * what happens when four come off a court together.
     *
     * @param  array<int, int>  $exclude
     * @return Collection<int, OpenPlayQueueEntry>
     */
    public function waitingQueue(OpenPlaySession $session, array $exclude = []): Collection
    {
        return OpenPlayQueueEntry::query()
            ->withoutGlobalScope('organization')
            ->with('player:id,name')
            ->where('open_play_session_id', $session->id)
            ->whereIn('status', [OpenPlayQueueEntry::WAITING, OpenPlayQueueEntry::UP_NEXT])
            ->when($exclude !== [], fn ($query) => $query->whereNotIn('player_id', $exclude))
            ->orderByRaw('COALESCE(queue_entered_at, created_at) asc')
            ->orderBy('position')
            ->get();
    }

    /**
     * Which of the players on court come off.
     *
     * In priority order:
     *
     *   1. anyone over the session's consecutive-games limit — a club that sets
     *      "two games maximum" means it, so they come off before the rule below
     *      gets a say;
     *   2. most games played back to back;
     *   3. longest on this court;
     *   4. earliest in the queue, so the result is stable rather than arbitrary.
     *
     * @param  array<int, int>  $onCourt
     * @return array<int, int>
     */
    private function chooseWhoComesOff(OpenPlaySession $session, array $onCourt, int $count): array
    {
        $limit = $session->max_consecutive_games;

        return OpenPlayQueueEntry::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->whereIn('player_id', $onCourt)
            ->get()
            ->sortBy([
                fn (OpenPlayQueueEntry $a, OpenPlayQueueEntry $b) => $this->overLimit($b, $limit) <=> $this->overLimit($a, $limit),
                fn (OpenPlayQueueEntry $a, OpenPlayQueueEntry $b) => $b->consecutive_games_played <=> $a->consecutive_games_played,
                fn (OpenPlayQueueEntry $a, OpenPlayQueueEntry $b) => ($a->court_entered_at?->timestamp ?? 0) <=> ($b->court_entered_at?->timestamp ?? 0),
                fn (OpenPlayQueueEntry $a, OpenPlayQueueEntry $b) => $a->position <=> $b->position,
            ])
            ->take($count)
            ->pluck('player_id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();
    }

    private function overLimit(OpenPlayQueueEntry $entry, ?int $limit): int
    {
        return $limit !== null && $entry->consecutive_games_played >= $limit ? 1 : 0;
    }

    /**
     * Write a decided rotation to the queue.
     *
     * Order matters here. The players coming off are appended *after* the tail
     * of the existing queue, so a queue of `P9 → P10` with `P1, P2` coming off
     * becomes `P9 → P10 → P1 → P2` and never the other way round.
     *
     * @param  array{stay: array<int,int>, out: array<int,int>, in: array<int,int>}  $plan
     */
    public function apply(OpenPlaySession $session, array $plan, ?int $courtId): void
    {
        $now = now();

        /* Everyone who played gets a game, whether they stay or go. */
        $played = array_merge($plan['stay'], $plan['out']);

        if ($played !== []) {
            $this->entries($session, $played)->each(function (OpenPlayQueueEntry $entry) use ($now) {
                $entry->increment('games_played');
                $entry->update(['last_played_at' => $now]);
            });
        }

        /* Staying on is what makes games consecutive. */
        foreach ($this->entries($session, $plan['stay']) as $entry) {
            $entry->increment('consecutive_games_played');
            $entry->update(['status' => OpenPlayQueueEntry::ON_COURT, 'assigned_court_id' => $courtId]);
        }

        /* Coming off resets the streak and starts a fresh wait, at the back. */
        $tail = (int) OpenPlayQueueEntry::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->max('position');

        foreach (array_values($plan['out']) as $index => $playerId) {
            /* They were playing, not waiting, so nothing is banked here — the
               wait they are starting now is counted when they next go on. */
            $this->entry($session, $playerId)?->update([
                'status' => OpenPlayQueueEntry::WAITING,
                'assigned_court_id' => null,
                'court_entered_at' => null,
                'queue_entered_at' => $now,
                'consecutive_games_played' => 0,
                'position' => $tail + $index + 1,
            ]);

            OpenPlayPlayer::query()
                ->withoutGlobalScope('organization')
                ->where('open_play_session_id', $session->id)
                ->where('player_id', $playerId)
                ->update(['status' => 'checked_in']);
        }

        /* Going on banks however long they stood there. */
        foreach ($plan['in'] as $playerId) {
            $entry = $this->entry($session, $playerId);

            $waited = $entry?->queue_entered_at ? max(0, $now->diffInSeconds($entry->queue_entered_at, true)) : 0;

            $entry?->update([
                'status' => OpenPlayQueueEntry::ON_COURT,
                'assigned_court_id' => $courtId,
                'court_entered_at' => $now,
                'queue_entered_at' => null,
                'total_waiting_seconds' => $entry->total_waiting_seconds + (int) $waited,
            ]);
        }

        $this->resequence($session);
    }

    /**
     * Close the gaps in the queue.
     *
     * Positions are only ever read in order, but they are also shown to people
     * as "#3 in line", and a stack that skips from 2 to 5 because somebody went
     * home reads as broken.
     */
    public function resequence(OpenPlaySession $session): void
    {
        $position = 0;

        foreach ($this->waitingQueue($session) as $entry) {
            $position++;

            if ((int) $entry->position !== $position) {
                $entry->update(['position' => $position]);
            }
        }
    }

    /**
     * Who is expected on next, without committing to it.
     *
     * The board shows this so the people at the front of the queue know to pick
     * their paddles up. It is a prediction from the current queue, not a
     * reservation — a game ending on another court can change it.
     *
     * @return array<int, int>
     */
    public function upNext(OpenPlaySession $session): array
    {
        return $this->waitingQueue($session)
            ->take($this->capacity($session))
            ->pluck('player_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /** @param array<int,int> $playerIds @return Collection<int, OpenPlayQueueEntry> */
    private function entries(OpenPlaySession $session, array $playerIds): Collection
    {
        if ($playerIds === []) {
            return collect();
        }

        return OpenPlayQueueEntry::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->whereIn('player_id', $playerIds)
            ->get();
    }

    private function entry(OpenPlaySession $session, int $playerId): ?OpenPlayQueueEntry
    {
        return OpenPlayQueueEntry::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->where('player_id', $playerId)
            ->first();
    }

    /**
     * Take a player out of the stack.
     *
     * Off a court or out of the queue, both end here. A player who leaves mid
     * game does not end the game — the court plays it out a player short and
     * the slot fills on the next rotation, which is what happens in the room.
     */
    public function leave(OpenPlaySession $session, int $playerId): void
    {
        $this->entry($session, $playerId)?->update([
            'status' => OpenPlayQueueEntry::LEFT,
            'assigned_court_id' => null,
            'court_entered_at' => null,
            'queue_entered_at' => null,
        ]);

        OpenPlayPlayer::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->where('player_id', $playerId)
            ->update(['status' => 'left', 'withdrawn_at' => now()]);

        $this->resequence($session);
    }

    /** Player ids currently on a live court in this session. */
    public function onCourtPlayerIds(OpenPlaySession $session): array
    {
        return OpenPlayMatch::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->where('status', 'live')
            ->with('participants:id,open_play_match_id,player_id')
            ->get()
            ->flatMap(fn (OpenPlayMatch $match) => $match->participants->pluck('player_id'))
            ->map(fn ($id) => (int) $id)
            ->all();
    }
}
