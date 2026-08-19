<?php

namespace App\Services;

use App\Models\ClubMatch;
use App\Models\OpenPlayMatch;
use App\Models\OpenPlayMatchPlayer;
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
        return $session->capacity();
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
     * `forceOut` and `keep` are staff's word overriding the algorithm's: anyone
     * named in `forceOut` comes off ahead of the automatic priority order, and
     * anyone named in `keep` is protected from it, as far as the queue actually
     * allows — the court still cannot hold more or fewer than it takes, so a
     * `keep` that would leave too few to fill it is not honoured.
     *
     * @param  array<int, int>  $onCourt  Player ids that just finished.
     * @param  array<int, int>  $forceOut  Player ids staff wants off regardless of priority.
     * @param  array<int, int>  $keep  Player ids staff wants to stay on regardless of priority.
     * @return array{stay: array<int,int>, out: array<int,int>, in: array<int,int>}
     */
    public function plan(OpenPlaySession $session, array $onCourt, array $forceOut = [], array $keep = []): array
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

        $out = $this->chooseWhoComesOff($session, $onCourt, $rotating, array_intersect($forceOut, $onCourt), array_intersect($keep, $onCourt));
        $stay = array_values(array_diff($onCourt, $out));
        $in = $waiting->take($rotating)->pluck('player_id')->map(fn ($id) => (int) $id)->all();

        return ['stay' => $stay, 'out' => $out, 'in' => $in];
    }

    /**
     * The waiting queue, in the order it will be served.
     *
     * `position` is FIFO by construction — join() and apply() both append at
     * `max(position) + 1`, in arrival order — so it agrees with arrival time in
     * every case except one: a staff reorder is exactly the case where it
     * should not, because moving someone in the line is the point. Ordering on
     * position alone, rather than arrival time with position as a tie-breaker,
     * is what lets a manual reorder actually change who is served next.
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
            ->orderBy('position')
            ->get();
    }

    /**
     * Which of the players on court come off.
     *
     * In priority order:
     *
     *   0. anyone staff named in `forceOut` — a manual override outranks the
     *      algorithm outright;
     *   1. anyone over the session's consecutive-games limit — a club that sets
     *      "two games maximum" means it, so they come off before the rule below
     *      gets a say;
     *   2. most games played back to back;
     *   3. longest on this court;
     *   4. earliest in the queue, so the result is stable rather than arbitrary.
     *
     * Anyone in `keep` is left out of the automatic pick entirely, unless
     * excluding them would leave too few players to choose from — the court
     * still has to end up with exactly `$count` coming off.
     *
     * @param  array<int, int>  $onCourt
     * @param  array<int, int>  $forceOut
     * @param  array<int, int>  $keep
     * @return array<int, int>
     */
    private function chooseWhoComesOff(OpenPlaySession $session, array $onCourt, int $count, array $forceOut = [], array $keep = []): array
    {
        $forced = array_slice(array_values(array_unique($forceOut)), 0, $count);
        $remaining = $count - count($forced);

        if ($remaining <= 0) {
            return $forced;
        }

        $eligible = array_values(array_diff($onCourt, $forced, $keep));

        /* A `keep` list that protects more players than the court can afford
           to spare is not honoured — somebody has to come off, and it is
           better to pick automatically than to leave the court short. */
        if (count($eligible) < $remaining) {
            $eligible = array_values(array_diff($onCourt, $forced));
        }

        $limit = $session->max_consecutive_games;

        $picked = OpenPlayQueueEntry::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->whereIn('player_id', $eligible)
            ->get()
            ->sortBy([
                fn (OpenPlayQueueEntry $a, OpenPlayQueueEntry $b) => $this->overLimit($b, $limit) <=> $this->overLimit($a, $limit),
                fn (OpenPlayQueueEntry $a, OpenPlayQueueEntry $b) => $b->consecutive_games_played <=> $a->consecutive_games_played,
                fn (OpenPlayQueueEntry $a, OpenPlayQueueEntry $b) => ($a->court_entered_at?->timestamp ?? 0) <=> ($b->court_entered_at?->timestamp ?? 0),
                fn (OpenPlayQueueEntry $a, OpenPlayQueueEntry $b) => $a->position <=> $b->position,
            ])
            ->take($remaining)
            ->pluck('player_id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        return array_merge($forced, $picked);
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
     * game does not end it: the score is kept per team, not per seat, so
     * whoever is next in the queue is seated in their place straight away and
     * the game carries on. Only when nobody is waiting does the court actually
     * play a player short.
     *
     * @return int|null The player id seated in their place, if the queue had one.
     */
    public function leave(OpenPlaySession $session, int $playerId): ?int
    {
        $entry = $this->entry($session, $playerId);
        $substitute = $entry?->status === OpenPlayQueueEntry::ON_COURT
            ? $this->vacateOnCourt($session, $playerId)
            : null;

        $entry?->update([
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

        return $substitute;
    }

    /**
     * Empty a seat on a live court, and fill it if anyone is waiting.
     *
     * Locked the same way a finish is: two devices on the same tablet can tap
     * "remove" and "finish" within the same second, and both touch the match
     * roster. If the match has already been completed by the time the lock is
     * granted, this backs off — the normal rotation has already dealt with the
     * court.
     *
     * With nobody waiting the seat is not left occupied by somebody who has
     * gone home: the participant row goes, the remaining players finish the
     * game short-handed, and the rotation that follows is about the players
     * still standing there. Leaving the row behind would put the person who
     * left back into the queue when the game ended, undoing the fact that they
     * left at all.
     *
     * @return int|null The player id seated in, if anyone was waiting.
     */
    private function vacateOnCourt(OpenPlaySession $session, int $playerId): ?int
    {
        $participant = OpenPlayMatchPlayer::query()
            ->withoutGlobalScope('organization')
            ->where('player_id', $playerId)
            ->whereHas('match', fn ($query) => $query->where('open_play_session_id', $session->id)->where('status', 'live'))
            ->first();

        if (! $participant) {
            return null;
        }

        $match = OpenPlayMatch::query()->withoutGlobalScope('organization')->lockForUpdate()->find($participant->open_play_match_id);

        if (! $match || $match->status !== 'live') {
            return null;
        }

        $incoming = $this->waitingQueue($session)->first();

        if (! $incoming) {
            $matchId = $participant->open_play_match_id;
            $participant->delete();
            $this->relabel($matchId);

            return null;
        }

        $this->seat($session, $participant, (int) $incoming->player_id, $match->court_id);

        return (int) $incoming->player_id;
    }

    /**
     * Put a player in a seat on a court: the match roster, the scoreboard's
     * team names and the queue bookkeeping together, so no two of them can
     * disagree about who is on.
     */
    private function seat(OpenPlaySession $session, OpenPlayMatchPlayer $participant, int $playerId, ?int $courtId): void
    {
        $participant->update(['player_id' => $playerId]);
        $this->relabel($participant->open_play_match_id);

        $entry = $this->entry($session, $playerId);
        $now = now();
        $waited = $entry?->queue_entered_at ? max(0, $now->diffInSeconds($entry->queue_entered_at, true)) : 0;

        $entry?->update([
            'status' => OpenPlayQueueEntry::ON_COURT,
            'assigned_court_id' => $courtId,
            'court_entered_at' => $now,
            'queue_entered_at' => null,
            'total_waiting_seconds' => $entry->total_waiting_seconds + (int) $waited,
        ]);

        OpenPlayPlayer::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->where('player_id', $playerId)
            ->update(['status' => 'playing']);
    }

    /**
     * Return players to the queue without crediting them a game.
     *
     * For a cancelled match: nothing was won, lost or played, so `games_played`
     * and the consecutive-games streak are left exactly as they were — only
     * where they stand in the queue changes. They go to the tail, behind
     * whoever was already waiting while the voided game was on, the same as
     * any other rotation off a court.
     *
     * @param  array<int, int>  $playerIds
     */
    public function release(OpenPlaySession $session, array $playerIds): void
    {
        if ($playerIds === []) {
            return;
        }

        $now = now();
        $tail = (int) OpenPlayQueueEntry::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->max('position');

        foreach (array_values($playerIds) as $index => $playerId) {
            $this->entry($session, $playerId)?->update([
                'status' => OpenPlayQueueEntry::WAITING,
                'assigned_court_id' => null,
                'court_entered_at' => null,
                'queue_entered_at' => $now,
                'position' => $tail + $index + 1,
            ]);

            OpenPlayPlayer::query()
                ->withoutGlobalScope('organization')
                ->where('open_play_session_id', $session->id)
                ->where('player_id', $playerId)
                ->update(['status' => 'checked_in']);
        }

        $this->resequence($session);
    }

    /**
     * Put the waiting queue in exactly this order.
     *
     * Staff's word, not the algorithm's — the automatic rotation never calls
     * this. `$orderedPlayerIds` has to be exactly the players currently
     * waiting, just reordered; it is not a way to add or remove anyone.
     *
     * @param  array<int, int>  $orderedPlayerIds
     */
    public function reorder(OpenPlaySession $session, array $orderedPlayerIds): void
    {
        $current = $this->waitingQueue($session)->pluck('player_id')->map(fn ($id) => (int) $id)->all();

        if ($this->sameSet($current, $orderedPlayerIds)) {
            foreach (array_values($orderedPlayerIds) as $index => $playerId) {
                $this->entry($session, (int) $playerId)?->update(['position' => $index + 1]);
            }
        }
    }

    /** Exchange two waiting players' places in the line. Neither has to be adjacent. */
    public function swap(OpenPlaySession $session, int $playerIdA, int $playerIdB): void
    {
        $order = $this->waitingQueue($session)->pluck('player_id')->map(fn ($id) => (int) $id)->all();
        $indexA = array_search($playerIdA, $order, true);
        $indexB = array_search($playerIdB, $order, true);

        if ($indexA === false || $indexB === false) {
            return;
        }

        [$order[$indexA], $order[$indexB]] = [$order[$indexB], $order[$indexA]];

        $this->reorder($session, $order);
    }

    /** Move one waiting player to a specific spot in the line, shifting the rest. */
    public function moveToPosition(OpenPlaySession $session, int $playerId, int $position): void
    {
        $order = $this->waitingQueue($session)->pluck('player_id')->map(fn ($id) => (int) $id)->all();
        $index = array_search($playerId, $order, true);

        if ($index === false) {
            return;
        }

        unset($order[$index]);
        $order = array_values($order);

        $target = max(0, min(count($order), $position - 1));
        array_splice($order, $target, 0, [$playerId]);

        $this->reorder($session, $order);
    }

    /**
     * Exchange a player on a court for one in the queue, before a point is
     * scored.
     *
     * FIFO survives this because it is a straight exchange of places, not a
     * queue jump: the player coming on gives up their spot in the line, and the
     * player going off takes the *same* spot rather than the tail. Sending them
     * to the tail would punish someone for a swap they did not ask for, and
     * putting them at the front would let staff hand out cuts. Nobody else in
     * the line moves.
     *
     * Only used before the first point — the caller enforces that. Neither
     * player's streak or games count changes, because no game has been played.
     *
     * The match roster is moved here too rather than by the caller, so the
     * seat and the queue cannot end up disagreeing about who is on the court.
     *
     * @return bool Whether the exchange was made.
     */
    public function exchange(OpenPlaySession $session, int $onCourtPlayerId, int $waitingPlayerId): bool
    {
        $leaving = $this->entry($session, $onCourtPlayerId);
        $arriving = $this->entry($session, $waitingPlayerId);

        if (! $leaving || ! $arriving) {
            return false;
        }

        $participant = OpenPlayMatchPlayer::query()
            ->withoutGlobalScope('organization')
            ->where('player_id', $onCourtPlayerId)
            ->whereHas('match', fn ($query) => $query->where('open_play_session_id', $session->id)->where('status', 'live'))
            ->first();

        if (! $participant) {
            return false;
        }

        $match = OpenPlayMatch::query()->withoutGlobalScope('organization')->lockForUpdate()->find($participant->open_play_match_id);

        if (! $match || $match->status !== 'live') {
            return false;
        }

        /* Read before the seating overwrites it: the spot the player coming on
           gives up is exactly the spot the player coming off inherits. */
        $spot = (int) $arriving->position;

        $this->seat($session, $participant, $waitingPlayerId, $match->court_id);

        $leaving->update([
            'status' => OpenPlayQueueEntry::WAITING,
            'assigned_court_id' => null,
            'court_entered_at' => null,
            'queue_entered_at' => now(),
            'position' => $spot,
        ]);

        OpenPlayPlayer::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->where('player_id', $onCourtPlayerId)
            ->update(['status' => 'checked_in']);

        $this->resequence($session);

        return true;
    }

    /**
     * Rebuild the names a match is shown and recorded under.
     *
     * The scoreboard carries team names rather than player ids, so a seat that
     * changes hands without this leaves a player who has gone home still
     * printed above the score.
     */
    private function relabel(int $matchId): void
    {
        $match = OpenPlayMatch::query()->withoutGlobalScope('organization')->find($matchId);

        if (! $match?->club_match_id) {
            return;
        }

        $participants = OpenPlayMatchPlayer::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_match_id', $matchId)
            ->with('player:id,name')
            ->get();

        $label = fn (string $side) => $participants
            ->filter(fn (OpenPlayMatchPlayer $entry) => $entry->team === $side)
            ->map(fn (OpenPlayMatchPlayer $entry) => (string) ($entry->player?->name ?? 'Player'))
            ->implode(' / ');

        ClubMatch::query()
            ->withoutGlobalScope('organization')
            ->where('id', $match->club_match_id)
            ->update(['team_one_name' => $label('one'), 'team_two_name' => $label('two')]);
    }

    /** @param array<int,int> $a @param array<int,int> $b */
    private function sameSet(array $a, array $b): bool
    {
        sort($a);
        sort($b);

        return $a === $b;
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
