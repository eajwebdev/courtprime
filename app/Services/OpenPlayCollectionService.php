<?php

namespace App\Services;

use App\Models\OpenPlayPlayer;
use App\Models\OpenPlaySession;
use Illuminate\Support\Facades\DB;

/**
 * What a session is owed, and by whom.
 *
 * Entry is charged per player, once, for being in the session. Checking in is
 * what buys the entry — the court time, the balls, the organising — not the
 * games that happen to come up before somebody goes home. A player who waited
 * an hour for a court still took a place in the session, and a club that has to
 * wait for a match to finish before it can ask for the fee is chasing money
 * around a hall.
 *
 * This used to charge only once a player had a completed game, so a full room
 * could show nothing owed. Whoever is on the sheet owes the entry.
 *
 * Which is why taking a player off the board only deletes them when there is
 * genuinely nothing to remember: no games and no money taken. That is the
 * front desk correcting a mistyped name. Anyone who played, or who has already
 * handed over cash, is kept and marked as gone so the night's takings still add
 * up at the end of it.
 */
class OpenPlayCollectionService
{
    /**
     * Games played per player in a session, from matches that finished.
     *
     * @return array<int, int>
     */
    public function gamesByPlayer(OpenPlaySession $session): array
    {
        return DB::table('open_play_match_players as p')
            ->join('open_play_matches as m', 'm.id', '=', 'p.open_play_match_id')
            ->where('m.open_play_session_id', $session->id)
            ->where('m.status', 'completed')
            ->groupBy('p.player_id')
            ->selectRaw('p.player_id, COUNT(*) as games')
            ->pluck('games', 'player_id')
            ->map(fn ($games) => (int) $games)
            ->all();
    }

    /** Whether this player has earned a charge yet. */
    public function hasPlayed(OpenPlaySession $session, int $playerId): bool
    {
        return ($this->gamesByPlayer($session)[$playerId] ?? 0) > 0;
    }

    /**
     * The collection sheet for a session.
     *
     * @return array{
     *     entry_fee: float,
     *     due: float,
     *     collected: float,
     *     outstanding: float,
     *     billable: int,
     *     unpaid: int,
     *     players: array<int, array<string, mixed>>
     * }
     */
    public function sheet(OpenPlaySession $session): array
    {
        $fee = (float) ($session->entry_fee ?? 0);
        $games = $this->gamesByPlayer($session);

        $rows = $session->players()
            ->withoutGlobalScope('organization')
            ->with('player:id,name')
            ->get()
            ->map(function (OpenPlayPlayer $entry) use ($fee, $games) {
                $played = $games[$entry->player_id] ?? 0;
                /* On the sheet is on the hook. This is the whole rule. */
                $due = $fee;
                $paid = (float) $entry->amount_paid;

                return [
                    'id' => $entry->id,
                    'player_id' => $entry->player_id,
                    'name' => $entry->player?->name ?? 'Player',
                    'games' => $played,
                    'status' => $entry->status,
                    /* Kept on the sheet after they have gone, because they
                       played and the club is still owed for it. */
                    'left' => $entry->status === 'left',
                    'due' => $due,
                    'paid' => $paid,
                    'outstanding' => max(0, round($due - $paid, 2)),
                    'settled' => $due <= $paid,
                ];
            })
            ->sortBy([['left', 'asc'], ['name', 'asc']])
            ->values()
            ->all();

        $due = array_sum(array_column($rows, 'due'));
        $collected = array_sum(array_column($rows, 'paid'));

        return [
            'entry_fee' => $fee,
            'due' => round($due, 2),
            'collected' => round($collected, 2),
            'outstanding' => round(max(0, $due - $collected), 2),
            'billable' => count(array_filter($rows, fn (array $row) => $row['due'] > 0)),
            'unpaid' => count(array_filter($rows, fn (array $row) => $row['outstanding'] > 0)),
            'players' => $rows,
        ];
    }

    /** Record what was handed over. Passing null settles whatever is left. */
    public function settle(OpenPlaySession $session, int $playerId, ?float $amount = null): void
    {
        $entry = $session->players()
            ->withoutGlobalScope('organization')
            ->where('player_id', $playerId)
            ->firstOrFail();

        $due = (float) ($session->entry_fee ?? 0);
        $paid = $amount ?? $due;

        $entry->update([
            'amount_paid' => round($paid, 2),
            'paid_at' => $paid > 0 ? now() : null,
        ]);
    }

    /**
     * Take a player off the board.
     *
     * Kept and marked as gone if anything happened worth remembering: a game
     * played, or money already taken. Otherwise deleted outright — nobody
     * played, nobody paid, and the row is a typo at the desk rather than a
     * person who owes the club anything.
     *
     * The paid check matters now that checking in is what is charged for. A
     * player can hand over the fee on arrival and be taken off the board a
     * minute later, and deleting that row would delete the money with it.
     */
    public function removePlayer(OpenPlaySession $session, int $playerId): string
    {
        $played = $this->hasPlayed($session, $playerId);

        $session->queue()
            ->withoutGlobalScope('organization')
            ->where('player_id', $playerId)
            ->delete();

        $entry = $session->players()
            ->withoutGlobalScope('organization')
            ->where('player_id', $playerId)
            ->first();

        if (! $entry) {
            return 'missing';
        }

        if ($played || (float) $entry->amount_paid > 0) {
            $entry->update(['status' => 'left', 'withdrawn_at' => now()]);

            return 'left';
        }

        $entry->delete();

        return 'removed';
    }
}
