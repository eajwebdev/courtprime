<?php

namespace App\Support;

use App\Models\Court;
use App\Models\OpenPlayCourtHold;
use App\Models\OpenPlaySession;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Who is scoring which court.
 *
 * The session ID and key get you onto the board; a court is what you take to
 * score it. One device per court, so a club with two courts has two people
 * keeping two games, and nobody is walking between them or locked out of a
 * pair they were handed.
 *
 * Everything about a hold is stored the way the session's own hold is: the
 * proof lives in the holder's server session, and only its hash is on the row,
 * so what is in the database cannot be replayed as a claim.
 */
final class OpenPlayCourtAccess
{
    /**
     * How long a court hold survives without checking in.
     *
     * The board polls every few seconds, so a court being scored never comes
     * close. This is for the phone that goes flat mid-game: without it that
     * court would be locked for the rest of the night.
     */
    private const STALE_AFTER_MINUTES = 10;

    private const PREFIX = 'open-play.court';

    public static function key(int $sessionId, int $courtId): string
    {
        return self::PREFIX.".{$sessionId}.{$courtId}";
    }

    /**
     * Take a court, if nobody else is scoring it.
     *
     * Locked and re-read inside the transaction for the same reason the
     * session hold is: two people tapping the same court in the same instant
     * would otherwise both read it as free.
     */
    public static function claim(Request $request, OpenPlaySession $session, Court $court, ?string $who = null): bool
    {
        $token = DB::transaction(function () use ($request, $session, $court, $who): ?string {
            $existing = OpenPlayCourtHold::query()
                ->withoutGlobalScope('organization')
                ->where('open_play_session_id', $session->id)
                ->where('court_id', $court->id)
                ->lockForUpdate()
                ->first();

            if ($existing && ! self::holds($request, $session, $court->id) && ! self::isStale($existing)) {
                return null;
            }

            $fresh = Str::random(48);

            OpenPlayCourtHold::query()->updateOrCreate(
                ['open_play_session_id' => $session->id, 'court_id' => $court->id],
                [
                    'organization_id' => $session->organization_id,
                    'token_hash' => hash('sha256', $fresh),
                    'holder_name' => trim((string) $who) ?: null,
                    'claimed_at' => now(),
                    'last_seen_at' => now(),
                ],
            );

            return $fresh;
        });

        if (! $token) {
            return false;
        }

        $request->session()->put(self::key($session->id, $court->id), $token);

        return true;
    }

    /** Whether this browser is the one scoring that court. */
    public static function holds(Request $request, OpenPlaySession $session, int $courtId): bool
    {
        $token = $request->session()->get(self::key($session->id, $courtId));

        if (! $token) {
            return false;
        }

        $hold = OpenPlayCourtHold::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->where('court_id', $courtId)
            ->first();

        return $hold !== null && hash_equals((string) $hold->token_hash, hash('sha256', $token));
    }

    /** Put a court down so somebody else can pick it up. */
    public static function release(Request $request, OpenPlaySession $session, int $courtId): void
    {
        if (self::holds($request, $session, $courtId)) {
            OpenPlayCourtHold::query()
                ->withoutGlobalScope('organization')
                ->where('open_play_session_id', $session->id)
                ->where('court_id', $courtId)
                ->delete();
        }

        $request->session()->forget(self::key($session->id, $courtId));
    }

    /** Every court this browser is scoring in this session. @return array<int,int> */
    public static function held(Request $request, OpenPlaySession $session): array
    {
        return self::rows($session)
            ->filter(fn (OpenPlayCourtHold $hold) => self::holds($request, $session, (int) $hold->court_id))
            ->map(fn (OpenPlayCourtHold $hold) => (int) $hold->court_id)
            ->values()
            ->all();
    }

    /**
     * The heartbeat. Every board load is one, so a court being actively scored
     * never goes stale under whoever is scoring it.
     */
    public static function touch(Request $request, OpenPlaySession $session, int $courtId): void
    {
        if (! self::holds($request, $session, $courtId)) {
            return;
        }

        OpenPlayCourtHold::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->where('court_id', $courtId)
            ->update(['last_seen_at' => now()]);
    }

    /** Hand back every court this browser holds in one session. */
    public static function releaseAll(Request $request, OpenPlaySession $session): void
    {
        foreach (self::rows($session) as $hold) {
            self::release($request, $session, (int) $hold->court_id);
        }
    }

    /**
     * Hand back every court this browser holds anywhere, for signing out.
     *
     * The proof of a hold lives in the server session, and logging out throws
     * that away — so without this the court stays flagged as being scored by a
     * token that no longer exists. It reads as taken on everybody else's board
     * and cannot be picked up until the stale window runs out, which is ten
     * minutes of nobody being able to score a court whose scorer went home.
     *
     * Walks the session's own keys rather than the database, because the
     * question being answered is "what was this browser holding", and the
     * session is the only thing that knows.
     */
    public static function releaseEverything(Request $request): void
    {
        $held = $request->session()->get(self::PREFIX);

        if (! is_array($held)) {
            return;
        }

        foreach ($held as $sessionId => $courts) {
            if (! is_array($courts)) {
                continue;
            }

            foreach ($courts as $courtId => $token) {
                if (! is_string($token)) {
                    continue;
                }

                OpenPlayCourtHold::query()
                    ->withoutGlobalScope('organization')
                    ->where('open_play_session_id', (int) $sessionId)
                    ->where('court_id', (int) $courtId)
                    ->where('token_hash', hash('sha256', $token))
                    ->delete();
            }
        }

        $request->session()->forget(self::PREFIX);
    }

    /** @return Collection<int, OpenPlayCourtHold> */
    public static function rows(OpenPlaySession $session): Collection
    {
        return OpenPlayCourtHold::query()
            ->withoutGlobalScope('organization')
            ->where('open_play_session_id', $session->id)
            ->get();
    }

    /** A hold nobody has checked in on is not a hold any more. */
    public static function isStale(OpenPlayCourtHold $hold): bool
    {
        $seen = $hold->last_seen_at ?? $hold->claimed_at;

        return $seen === null || $seen->lt(now()->subMinutes(self::STALE_AFTER_MINUTES));
    }
}
