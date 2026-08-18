<?php

namespace App\Support;

use App\Models\OpenPlaySession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Who is allowed onto an open play board, and under what name.
 *
 * Three routes let someone in: the board gate, a signed-in player joining with
 * the code, and a walk-in joining with the code. All three have to agree on
 * where the grant is kept, so the keys are defined once, here, rather than
 * three times in three controllers.
 *
 * The grant lives in the server session, so the board is never a URL that can
 * be forwarded or guessed into. The name is only ever used to sign entries in
 * the session's activity log.
 */
final class OpenPlayBoardAccess
{
    public static function grantKey(int $sessionId): string
    {
        return "open_play_grant.{$sessionId}";
    }

    public static function actorKey(int $sessionId): string
    {
        return "open-play.actor.{$sessionId}";
    }

    public static function hostKey(int $sessionId): string
    {
        return "open-play.organizer.{$sessionId}";
    }

    /** Let this browser onto the board, and remember who is holding it. */
    public static function grant(Request $request, OpenPlaySession $session, ?string $who = null): void
    {
        $request->session()->put(self::grantKey($session->id), true);

        $name = trim((string) $who);

        if ($name !== '') {
            $request->session()->put(self::actorKey($session->id), $name);
        }
    }

    /**
     * Mark the first device in as the host.
     *
     * Wrapped in a transaction with the row locked: two people can enter the
     * key in the same instant, and a plain read-then-write would let both see
     * an unclaimed session and both become host. The lock serialises the claim
     * so exactly one wins.
     *
     * The host badge is a label, not a permission. Everyone who gets through
     * with the ID and key can run the board; the log records who did what.
     */
    public static function claimHost(Request $request, OpenPlaySession $session): void
    {
        $token = DB::transaction(function () use ($session): ?string {
            $locked = OpenPlaySession::query()
                ->withoutGlobalScope('organization')
                ->lockForUpdate()
                ->find($session->id);

            if (! $locked || $locked->organizer_token) {
                return null;
            }

            $fresh = Str::random(48);

            $locked->update([
                'organizer_token' => hash('sha256', $fresh),
                'organizer_claimed_at' => now(),
            ]);

            return $fresh;
        });

        if ($token) {
            $request->session()->put(self::hostKey($session->id), $token);
        }
    }

    /** The stored token is hashed, so the raw value never sits in the database. */
    public static function isHost(Request $request, OpenPlaySession $session): bool
    {
        $token = $request->session()->get(self::hostKey($session->id));

        return is_string($token)
            && is_string($session->organizer_token)
            && hash_equals($session->organizer_token, hash('sha256', $token));
    }
}
