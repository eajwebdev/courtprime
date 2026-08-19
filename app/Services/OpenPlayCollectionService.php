<?php

namespace App\Services;

use App\Models\OpenPlayPlayer;
use App\Models\OpenPlaySession;
use Illuminate\Support\Facades\DB;

/**
 * What a session is owed, and by whom.
 *
 * Entry is charged per player, once, and only once they have played. Someone
 * who checked in, waited for a court and went home before one came free owes
 * nothing: they were never on it. Someone who played a single game owes the
 * full entry, because that is what entry buys.
 *
 * That rule is why taking a player off the board does not delete them once they
 * have a game. The row is kept and marked as gone, so the money they owe is
 * still on the sheet at the end of the night. Removing somebody who never
 * played does delete them, because there is nothing to remember.
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
                /* No games, no charge. This is the whole rule. */
                $due = $played > 0 ? $fee : 0.0;
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

        $due = $this->hasPlayed($session, $playerId) ? (float) ($session->entry_fee ?? 0) : 0.0;
        $paid = $amount ?? $due;

        $entry->update([
            'amount_paid' => round($paid, 2),
            'paid_at' => $paid > 0 ? now() : null,
        ]);
    }

    /**
     * Take a player off the board.
     *
     * Played at least once: kept, marked as gone, still on the collection
     * sheet. Never played: deleted outright, because nothing is owed and
     * nothing happened.
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

        if ($played) {
            $entry->update(['status' => 'left', 'withdrawn_at' => now()]);

            return 'left';
        }

        $entry->delete();

        return 'removed';
    }
}
