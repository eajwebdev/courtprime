import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ArrowUpDown, Ban, History, LogIn, Pause, Play, Repeat2, Settings2, Trophy, UserMinus, UserPlus, Users } from 'lucide-react';

export type ActivityEntry = {
    id: number;
    type: string;
    title: string;
    description?: string | null;
    actor: string;
    at?: string | null;
};

/* One icon per kind of thing that can happen, so the log is scannable at a
   glance from across a court rather than read line by line. */
const icons: Record<string, typeof History> = {
    'open_play.player_added': UserPlus,
    'open_play.player_removed': UserMinus,
    'open_play.match_finished': Trophy,
    'open_play.settings_updated': Settings2,
    'open_play.started': Play,
    'open_play.board_opened': LogIn,
    'open_play.player_joined': LogIn,
    'open_play.match_cancelled': Ban,
    'open_play.rotation_paused': Pause,
    'open_play.rotation_resumed': Play,
    'open_play.queue_reordered': ArrowUpDown,
    'open_play.player_swapped': Repeat2,
    'open_play.teams_arranged': Users,
};

/**
 * Who did what, newest first.
 *
 * Anyone holding the session ID and key can change this board, which is what
 * makes a drop-in session workable, and is also why it needs a record. Nothing
 * here restricts anyone; it just means the answer to "who took Marco off the
 * list" exists.
 */
export function ActivityFeed({
    entries,
    className,
    hideHeader = false,
}: {
    entries: ActivityEntry[];
    className?: string;
    /** The slide-over draws its own title bar, so it suppresses this one. */
    hideHeader?: boolean;
}) {
    return (
        <div className={cn('flex min-h-0 flex-col', className)}>
            <div className={cn('border-border flex items-center justify-between gap-3 border-b px-4 py-2.5', hideHeader && 'hidden')}>
                <p className="text-label text-foreground flex items-center gap-1.5 font-semibold">
                    <History className="size-4 shrink-0" aria-hidden />
                    Session history
                </p>
                <p className="text-meta text-muted">
                    <span data-numeric>{entries.length}</span>
                </p>
            </div>

            {entries.length === 0 ? (
                <p className="text-meta text-muted px-4 py-8 text-center">Nothing has happened yet.</p>
            ) : (
                <ul className="divide-border min-h-0 flex-1 divide-y overflow-y-auto">
                    {entries.map((entry) => {
                        const Icon = icons[entry.type] ?? History;

                        return (
                            <li key={entry.id} className="flex items-start gap-3 px-4 py-2.5">
                                <span
                                    aria-hidden
                                    className="bg-surface-muted text-muted mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full"
                                >
                                    <Icon className="size-3.5" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-label text-foreground">
                                        <span className="font-medium">{entry.actor}</span>{' '}
                                        <span className="text-secondary">{entry.title.toLowerCase()}</span>
                                    </p>
                                    {entry.description && <p className="text-meta text-muted mt-0.5 break-words">{entry.description}</p>}
                                </div>
                                <span className="text-meta text-muted shrink-0 tabular-nums">{timeAgo(entry.at)}</span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
