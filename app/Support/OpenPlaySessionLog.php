<?php

namespace App\Support;

use App\Models\ActivityTimelineEvent;
use App\Models\OpenPlaySession;
use Illuminate\Http\Request;

/**
 * What happened on an open play board, and who did it.
 *
 * Anyone holding the session ID and key can run the board: add people, change
 * what a win is, record a result. That is deliberate, because a tablet at a
 * court gets put down and picked up by whoever is nearest. The trade is that
 * every change has to be attributable, which is what this writes.
 *
 * Entries go to `activity_timeline_events` rather than a table of their own,
 * subject-keyed to the session.
 */
final class OpenPlaySessionLog
{
    public static function record(Request $request, OpenPlaySession $session, string $type, string $title, ?string $description = null): void
    {
        ActivityTimelineEvent::query()->create([
            'organization_id' => $session->organization_id,
            'branch_id' => $session->branch_id,
            /* Null for a walk-in with no account. The name in metadata is what
               the board shows either way. */
            'actor_id' => $request->user()?->id,
            'subject_type' => OpenPlaySession::class,
            'subject_id' => $session->id,
            'event_type' => $type,
            'title' => $title,
            'description' => $description,
            'visibility' => 'team',
            'metadata' => [
                'actor_name' => self::actor($request, $session),
                'session_code' => $session->session_code,
            ],
            'occurred_at' => now(),
        ]);
    }

    /** Who is on this device: the signed-in name, or the one given on the way in. */
    public static function actor(Request $request, OpenPlaySession $session): string
    {
        if ($user = $request->user()) {
            return (string) $user->name;
        }

        $stored = $request->session()->get(OpenPlayBoardAccess::actorKey($session->id));

        return is_string($stored) && trim($stored) !== '' ? trim($stored) : 'Someone on the board';
    }
}
