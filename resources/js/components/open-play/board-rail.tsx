import { ActivityFeed, type ActivityEntry } from '@/components/open-play/activity-feed';
import { RosterPanel, type RosterEntry } from '@/components/open-play/roster-panel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { ChevronDown, ChevronsUp, ChevronUp, Trophy, Users } from 'lucide-react';
import { useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payload from PublicOpenPlayBoardController. */

type Tab = 'players' | 'next' | 'standings' | 'history';

/**
 * The side of a running board.
 *
 * Four panels, one at a time, rather than four cards stacked. Stacked, each got
 * about forty pixels on a tablet and every one of them was cut off mid row,
 * which is worse than not showing them: the whole point of a fixed board is
 * that what is on screen is complete. Tabs give whichever one is being used the
 * full height, and the counts stay visible on the tabs that are not.
 */
/** "just now", then minutes, then hours — the resolution a queue is read at. */
function waitLabel(seconds?: number | null) {
    const total = Math.max(0, Number(seconds ?? 0));

    if (total < 60) return 'just now';
    if (total < 3600) return `${Math.floor(total / 60)}m`;

    return `${Math.floor(total / 3600)}h ${Math.floor((total % 3600) / 60)}m`;
}

export function BoardRail({
    base,
    roster,
    waiting,
    upNext = null,
    results,
    activity,
    needed,
    className,
}: {
    base: string;
    roster: RosterEntry[];
    waiting: any[];
    /** The next four and which two are on each side, as it would be drawn now. */
    upNext?: { ready: boolean; needed: number; teams: { one: any[]; two: any[] } | null; players: any[] } | null;
    results: any[];
    activity: ActivityEntry[];
    needed: number;
    className?: string;
}) {
    const [tab, setTab] = useState<Tab>('players');
    const [editing, setEditing] = useState(false);

    /*
     * The stack keeps itself in order; this is for what it cannot know —
     * somebody who stepped out to their car, or a beginner being moved up so
     * they are not last all night. Off by default, because the queue is read
     * far more often than it is edited and a row full of arrows invites
     * fiddling with an order that is already fair.
     */
    const move = (playerId: number, position: number) =>
        router.post(`${base}/queue/move`, { player_id: playerId, position }, { preserveScroll: true, preserveState: true });

    return (
        <aside className={cn('flex min-h-0 flex-col gap-3', className)}>
            <div
                role="tablist"
                aria-label="Board panels"
                className="border-border bg-surface-muted grid shrink-0 grid-cols-4 gap-1 rounded-xl border p-1"
            >
                <RailTab active={tab === 'players'} count={roster.length} onClick={() => setTab('players')}>
                    Players
                </RailTab>
                <RailTab active={tab === 'next'} count={waiting.length} onClick={() => setTab('next')}>
                    Up next
                </RailTab>
                <RailTab active={tab === 'standings'} count={results.length} onClick={() => setTab('standings')}>
                    Table
                </RailTab>
                <RailTab active={tab === 'history'} count={activity.length} onClick={() => setTab('history')}>
                    History
                </RailTab>
            </div>

            {tab === 'players' && <RosterPanel base={base} roster={roster} step={false} hideHeading className="min-h-0 flex-1" />}

            {tab === 'next' && (
                <Panel
                    icon={Users}
                    title="Up next"
                    empty={waiting.length === 0 ? 'Nobody waiting.' : null}
                    action={
                        waiting.length > 1 ? (
                            <button
                                type="button"
                                onClick={() => setEditing((current) => !current)}
                                className={cn(
                                    'text-meta font-medium transition-colors',
                                    editing ? 'text-primary' : 'text-muted hover:text-foreground',
                                )}
                            >
                                {editing ? 'Done' : 'Reorder'}
                            </button>
                        ) : null
                    }
                >
                    {/* Who is on next, and with whom. The list underneath is
                        the order they will be called in; this is the game the
                        front of it makes. */}
                    {upNext && (
                        <div className="border-border bg-surface-muted shrink-0 border-b px-4 py-3">
                            {upNext.ready && upNext.teams ? (
                                <>
                                    <p className="text-meta text-muted mb-2">Next on court</p>
                                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                        <PairSide players={upNext.teams.one} />
                                        <span className="text-meta text-muted font-semibold">vs</span>
                                        <PairSide players={upNext.teams.two} align="right" />
                                    </div>
                                    <p className="text-meta text-muted mt-2">
                                        Drawn from the front of the queue. A game finishing elsewhere can change it.
                                    </p>
                                </>
                            ) : (
                                <p className="text-meta text-muted">
                                    <span data-numeric className="text-foreground font-semibold">
                                        {upNext.needed}
                                    </span>{' '}
                                    more {upNext.needed === 1 ? 'player' : 'players'} and the next game can be drawn.
                                </p>
                            )}
                        </div>
                    )}

                    <ul className="divide-border min-h-0 flex-1 divide-y overflow-y-auto">
                        {waiting.map((entry, index) => (
                            <li key={entry.player_id} className="flex items-center gap-3 px-4 py-2.5">
                                {/* The server decides who is up next, because it
                                    knows whether this is singles or doubles. The
                                    board used to assume four. */}
                                <span
                                    data-numeric
                                    className={cn(
                                        'text-meta flex size-7 shrink-0 items-center justify-center rounded-full font-semibold',
                                        entry.up_next && needed === 0 ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-muted',
                                    )}
                                >
                                    {entry.position ?? index + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-label text-foreground truncate font-medium">{entry.name}</p>
                                    <p className="text-meta text-muted">
                                        {/* How long they have stood there is the
                                            thing somebody waiting actually wants
                                            to see, ahead of their record. */}
                                        <span data-numeric>{waitLabel(entry.waiting_seconds)}</span> waiting · <span data-numeric>{entry.games}</span>{' '}
                                        {entry.games === 1 ? 'game' : 'games'}
                                        {entry.consecutive_games > 0 && (
                                            <>
                                                {' · '}
                                                <span data-numeric>{entry.consecutive_games}</span> in a row
                                            </>
                                        )}
                                    </p>
                                </div>

                                {editing && (
                                    <div className="flex shrink-0 items-center gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="iconSm"
                                            aria-label={`Move ${entry.name} to the front`}
                                            title="Move to the front"
                                            disabled={index === 0}
                                            onClick={() => move(entry.player_id, 1)}
                                        >
                                            <ChevronsUp className="size-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="iconSm"
                                            aria-label={`Move ${entry.name} up`}
                                            title="Move up one"
                                            disabled={index === 0}
                                            onClick={() => move(entry.player_id, index)}
                                        >
                                            <ChevronUp className="size-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="iconSm"
                                            aria-label={`Move ${entry.name} down`}
                                            title="Move down one"
                                            disabled={index === waiting.length - 1}
                                            onClick={() => move(entry.player_id, index + 2)}
                                        >
                                            <ChevronDown className="size-4" />
                                        </Button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </Panel>
            )}

            {tab === 'standings' && (
                <Panel icon={Trophy} title="Standings" empty={results.length === 0 ? 'No results yet.' : null}>
                    <ul className="divide-border min-h-0 flex-1 divide-y overflow-y-auto">
                        {results.map((row, index) => (
                            <li key={row.player_id} className="flex items-center gap-3 px-4 py-2.5">
                                <span data-numeric className="text-meta text-muted w-4 shrink-0 text-right">
                                    {index + 1}
                                </span>
                                <p className="text-label text-foreground min-w-0 flex-1 truncate">{row.name}</p>
                                <p className="text-meta text-muted shrink-0">
                                    <span data-numeric className="text-foreground font-semibold">
                                        {row.wins}
                                    </span>
                                    <span className="text-muted">/</span>
                                    <span data-numeric>{row.games}</span>
                                </p>
                            </li>
                        ))}
                    </ul>
                </Panel>
            )}

            {tab === 'history' && (
                <div className="border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border">
                    <ActivityFeed entries={activity} />
                </div>
            )}
        </aside>
    );
}

/** One side of the next game: the two names that will be partners. */
function PairSide({ players, align = 'left' }: { players: any[]; align?: 'left' | 'right' }) {
    return (
        <div className={cn('min-w-0', align === 'right' && 'text-right')}>
            {players.map((player) => (
                <p key={player.id} className="text-label text-foreground truncate font-semibold">
                    {player.name}
                </p>
            ))}
        </div>
    );
}

function RailTab({ active, count, onClick, children }: { active: boolean; count: number; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={cn(
                'flex h-10 flex-col items-center justify-center rounded-lg px-1 transition-colors',
                active ? 'bg-surface text-foreground shadow-e1' : 'text-muted hover:text-foreground',
            )}
        >
            <span className="text-[0.6875rem] leading-none font-medium">{children}</span>
            <span data-numeric className={cn('text-meta leading-tight font-semibold', active ? 'text-primary' : 'text-muted')}>
                {count}
            </span>
        </button>
    );
}

function Panel({
    icon: Icon,
    title,
    empty,
    action,
    children,
}: {
    icon: typeof Users;
    title: string;
    empty: string | null;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border">
            <div className="border-border bg-surface-muted flex shrink-0 items-center gap-1.5 border-b px-4 py-2.5">
                <Icon className="text-muted size-4 shrink-0" aria-hidden />
                <p className="text-label text-foreground font-semibold">{title}</p>
                {action && <span className="ml-auto shrink-0">{action}</span>}
            </div>
            {empty ? <p className="text-meta text-muted px-4 py-10 text-center">{empty}</p> : children}
        </div>
    );
}
