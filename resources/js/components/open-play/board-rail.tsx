import { ActivityFeed, type ActivityEntry } from '@/components/open-play/activity-feed';
import { CollectionsPanel, type CollectionSheet } from '@/components/open-play/collections-panel';
import { RosterPanel, type RosterEntry } from '@/components/open-play/roster-panel';
import { cn } from '@/lib/utils';
import { Trophy, Users } from 'lucide-react';
import { useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payload from PublicOpenPlayBoardController. */

type Tab = 'players' | 'next' | 'money' | 'standings' | 'history';

/**
 * The side of a running board.
 *
 * Four panels, one at a time, rather than four cards stacked. Stacked, each got
 * about forty pixels on a tablet and every one of them was cut off mid row,
 * which is worse than not showing them: the whole point of a fixed board is
 * that what is on screen is complete. Tabs give whichever one is being used the
 * full height, and the counts stay visible on the tabs that are not.
 */
export function BoardRail({
    base,
    roster,
    waiting,
    results,
    activity,
    collections,
    needed,
    className,
}: {
    base: string;
    roster: RosterEntry[];
    waiting: any[];
    results: any[];
    activity: ActivityEntry[];
    collections: CollectionSheet;
    needed: number;
    className?: string;
}) {
    const [tab, setTab] = useState<Tab>('players');

    return (
        <aside className={cn('flex min-h-0 flex-col gap-3', className)}>
            <div
                role="tablist"
                aria-label="Board panels"
                className="border-border bg-surface-muted grid shrink-0 grid-cols-5 gap-1 rounded-xl border p-1"
            >
                <RailTab active={tab === 'players'} count={roster.length} onClick={() => setTab('players')}>
                    Players
                </RailTab>
                <RailTab active={tab === 'next'} count={waiting.length} onClick={() => setTab('next')}>
                    Up next
                </RailTab>
                <RailTab active={tab === 'money'} count={collections.unpaid} onClick={() => setTab('money')}>
                    Money
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
                <Panel icon={Users} title="Up next" empty={waiting.length === 0 ? 'Nobody waiting.' : null}>
                    <ul className="divide-border min-h-0 flex-1 divide-y overflow-y-auto">
                        {waiting.map((entry, index) => (
                            <li key={entry.player_id} className="flex items-center gap-3 px-4 py-2.5">
                                <span
                                    data-numeric
                                    className={cn(
                                        'text-meta flex size-7 shrink-0 items-center justify-center rounded-full font-semibold',
                                        needed === 0 && index < 4 ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-muted',
                                    )}
                                >
                                    {index + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-label text-foreground truncate font-medium">{entry.name}</p>
                                    <p className="text-meta text-muted">
                                        <span data-numeric>{entry.games}</span> {entry.games === 1 ? 'game' : 'games'} ·{' '}
                                        <span data-numeric>{entry.wins}</span> won
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Panel>
            )}

            {tab === 'money' && <CollectionsPanel base={base} sheet={collections} />}

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

function Panel({ icon: Icon, title, empty, children }: { icon: typeof Users; title: string; empty: string | null; children: React.ReactNode }) {
    return (
        <div className="border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border">
            <div className="border-border bg-surface-muted flex shrink-0 items-center gap-1.5 border-b px-4 py-2.5">
                <Icon className="text-muted size-4 shrink-0" aria-hidden />
                <p className="text-label text-foreground font-semibold">{title}</p>
            </div>
            {empty ? <p className="text-meta text-muted px-4 py-10 text-center">{empty}</p> : children}
        </div>
    );
}
