<?php

namespace App\Support;

use App\Models\OpenPlaySession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Who is holding an open play board.
 *
 * One device at a time. The session ID and key are not a way to join a game,
 * they are the controls: whoever enters them runs the board, and while they
 * hold it nobody else can open it, even with the right pair. They hand it over
 * by releasing it, and then the next person uses the same pair.
 *
 * That is stricter than a shared board, and deliberately so. Two tablets both
 * adding players and both recording results is how a rotation gets two versions
 * of who is next.
 *
 * The hold is kept in the server session, so it cannot be forwarded in a URL,
 * and mirrored on the session row as a hash so the server can tell whether a
 * given browser is the holder.
 */
final class OpenPlayBoardAccess
{
    /**
     * How long a hold survives without the board checking in.
     *
     * The board polls every eight seconds, so an open one never comes close.
     * This exists for the tablet that runs out of battery mid-session: without
     * it, that session would be locked until someone edited the database.
     */
    private const STALE_AFTER_MINUTES = 10;

    /**
     * Where the holds live in the server session.
     *
     * The dots are Laravel's nesting, so every hold this browser has sits under
     * one branch and `releaseAll` can find them without knowing the ids.
     */
    private const HOLDER_PREFIX = 'open-play.holder';

    public static function grantKey(int $sessionId): string
    {
        return "open_play_grant.{$sessionId}";
    }

    public static function actorKey(int $sessionId): string
    {
        return "open-play.actor.{$sessionId}";
    }

    public static function holderKey(int $sessionId): string
    {
        return self::HOLDER_PREFIX.'.'.$sessionId;
    }

    /**
     * Take the board, if it is free.
     *
     * Locked and re-read inside the transaction: two people entering the pair
     * in the same instant would otherwise both read it as free and both become
     * the holder, which is the exact situation this is here to prevent.
     *
     * Returns false when somebody else is holding it.
     */
    public static function claim(Request $request, OpenPlaySession $session, ?string $who = null): bool
    {
        $token = DB::transaction(function () use ($request, $session): ?string {
            $locked = OpenPlaySession::query()
                ->withoutGlobalScope('organization')
                ->lockForUpdate()
                ->find($session->id);

            if (! $locked) {
                return null;
            }

            if ($locked->organizer_token && ! self::isHolder($request, $locked) && ! self::hasGoneQuiet($locked)) {
                return null;
            }

            $fresh = Str::random(48);

            $locked->update([
                'organizer_token' => hash('sha256', $fresh),
                'organizer_claimed_at' => now(),
                'organizer_last_seen_at' => now(),
            ]);

            return $fresh;
        });

        if (! $token) {
            return false;
        }

        $request->session()->put(self::holderKey($session->id), $token);
        $request->session()->put(self::grantKey($session->id), true);

        $name = trim((string) $who);

        if ($name !== '') {
            $request->session()->put(self::actorKey($session->id), $name);
        }

        return true;
    }

    /** Hand the board back so the next person can take it with the same pair. */
    public static function release(Request $request, OpenPlaySession $session): void
    {
        if (self::isHolder($request, $session)) {
            OpenPlaySession::query()
                ->withoutGlobalScope('organization')
                ->whereKey($session->id)
                ->update([
                    'organizer_token' => null,
                    'organizer_claimed_at' => null,
                    'organizer_last_seen_at' => null,
                ]);
        }

        $request->session()->forget(self::holderKey($session->id));
        $request->session()->forget(self::grantKey($session->id));
    }

    /**
     * Hand back every board this browser holds.
     *
     * For signing out, which throws the server session away. The proof of the
     * hold lives in that session, so without this the board is left flagged as
     * held by a token that no longer exists anywhere: it reads as live on the
     * desk, and the next player with the right ID and key is turned away until
     * the stale window runs out. Releasing first means the board goes quiet the
     * moment its holder leaves, and the pair works again straight away.
     */
    public static function releaseAll(Request $request): void
    {
        $held = $request->session()->get(self::HOLDER_PREFIX);

        if (! is_array($held)) {
            return;
        }

        $sessions = OpenPlaySession::query()
            ->withoutGlobalScope('organization')
            ->findMany(array_keys($held));

        foreach ($sessions as $session) {
            self::release($request, $session);
        }

        /* Holds pointing at sessions that no longer exist. */
        $request->session()->forget(self::HOLDER_PREFIX);
    }

    /** The stored token is hashed, so the raw value never sits in the database. */
    public static function isHolder(Request $request, OpenPlaySession $session): bool
    {
        $token = $request->session()->get(self::holderKey($session->id));

        return is_string($token)
            && is_string($session->organizer_token)
            && hash_equals($session->organizer_token, hash('sha256', $token));
    }

    /** Called on every board poll, which is what keeps the hold alive. */
    public static function touch(Request $request, OpenPlaySession $session): void
    {
        if (! self::isHolder($request, $session)) {
            return;
        }

        OpenPlaySession::query()
            ->withoutGlobalScope('organization')
            ->whereKey($session->id)
            ->update(['organizer_last_seen_at' => now()]);
    }

    /** A hold nobody has refreshed for long enough that it can be taken over. */
    public static function hasGoneQuiet(OpenPlaySession $session): bool
    {
        if (! $session->organizer_token) {
            return true;
        }

        $seen = $session->organizer_last_seen_at ?? $session->organizer_claimed_at;

        return $seen === null || $seen->lt(now()->subMinutes(self::STALE_AFTER_MINUTES));
    }

    public static function staleAfterMinutes(): int
    {
        return self::STALE_AFTER_MINUTES;
    }
}
