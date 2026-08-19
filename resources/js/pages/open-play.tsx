import { ConfirmDialog } from '@/components/confirm-dialog';
import { CollectionsPanel, type CollectionSheet } from '@/components/open-play/collections-panel';
import { SessionCreateDialog } from '@/components/open-play/session-create-dialog';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { currency, time12h } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Check, Copy, LogOut, MonitorPlay, Plus, RotateCw } from 'lucide-react';
import { useState, type ReactNode } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payloads come from OpenPlayController. */

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Open Play', href: '/open-play' }];

type Props = {
    sessions: any;
    activeSession: any;
    board: { held: boolean; since: string | null; last_seen: string | null; quiet: boolean } | null;
    collections: CollectionSheet | null;
    sessionCourts: any[];
    liveMatches: any[];
    waiting: any[];
    branches: any[];
};

/**
 * Running open play from the office.
 *
 * The page used to be one column a metre long: the code, the courts, the queue,
 * a permanent create form, then the session list. Now the session being run
 * fills the screen and the rest is beside it, so the two things anyone opens
 * this page for, reading out the ID and seeing who is waiting, need no
 * scrolling at all.
 */
export default function OpenPlay({
    sessions,
    activeSession,
    board,
    collections,
    sessionCourts = [],
    liveMatches = [],
    waiting = [],
    branches,
}: Props) {
    const [copied, setCopied] = useState(false);
    const [creating, setCreating] = useState(false);

    /* Allocated courts with nothing on them. Leaving them off the board made
       an idle court look like a court that was never selected. */
    const busyCourts = liveMatches.map((match) => match.court);
    const idleCourts = sessionCourts.filter((court: any) => !busyCourts.includes(court.name));
    /* Four is a match. Below that nobody can be called, however long they wait. */
    const canCall = waiting.length >= 4 && idleCourts.length > 0;

    const releaseCourt = (matchId: number) => {
        router.post(`/open-play/${activeSession.id}/matches/${matchId}/complete`, {}, { preserveScroll: true });
    };

    const copyCode = async () => {
        /* Both halves together: they are useless apart. */
        await navigator.clipboard?.writeText(`${activeSession.session_code ?? ''} · key ${activeSession.session_key ?? ''}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Open Play" />

            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
                <div className="min-w-0 space-y-5">
                    {activeSession ? (
                        <>
                            {/*
                             * The ID and key are the largest thing on the page
                             * because a member of staff reads them out across a
                             * hall while players type them in.
                             */}
                            <section className="bg-surface-deep text-surface-deep-foreground rounded-2xl px-4 py-5 sm:px-6">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-eyebrow text-primary uppercase">Share both with players</p>
                                        <div className="mt-1 flex flex-wrap items-baseline gap-x-5 gap-y-1">
                                            <p
                                                data-numeric
                                                className="text-[2rem] leading-none font-semibold tracking-tight text-white sm:text-[2.5rem]"
                                            >
                                                {activeSession.session_code ?? '—'}
                                            </p>
                                            <p className="text-eyebrow text-white/45 uppercase">
                                                key{' '}
                                                <span
                                                    data-numeric
                                                    className="text-primary text-[1.5rem] leading-none font-semibold tracking-[0.15em]"
                                                >
                                                    {activeSession.session_key ?? '—'}
                                                </span>
                                            </p>
                                        </div>
                                        <p className="text-meta mt-2 truncate text-white/55">
                                            {activeSession.name} · {activeSession.branch?.name} · {activeSession.format ?? 'doubles'} · round{' '}
                                            <span data-numeric>{activeSession.current_round ?? 0}</span>
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 flex-wrap gap-2">
                                        <Button type="button" variant="onDeep" onClick={copyCode}>
                                            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                                            {copied ? 'Copied' : 'Copy ID + key'}
                                        </Button>
                                        <Button asChild>
                                            <Link href={`/open-play/${activeSession.session_code}/board`}>
                                                <MonitorPlay className="size-4" />
                                                Open board
                                            </Link>
                                        </Button>
                                    </div>
                                </div>

                                <dl className="mt-4 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-4">
                                    <Metric label="Courts" value={sessionCourts.length} />
                                    <Metric label="On court" value={liveMatches.length * (activeSession.format === 'singles' ? 2 : 4)} />
                                    <Metric label="Waiting" value={waiting.length} />
                                    <Metric label="To collect" value={currency(collections?.outstanding ?? 0)} />
                                </dl>

                                {/* The board is held by one device. When that device
                                    goes home in somebody's bag, this is how the desk
                                    gets it back. */}
                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                    <p className="text-meta text-white/55">
                                        {board?.held
                                            ? board.quiet
                                                ? 'A device holds the board but has gone quiet.'
                                                : 'A device is running the board now.'
                                            : 'Nobody is holding the board.'}
                                    </p>
                                    {board?.held && (
                                        <ConfirmDialog
                                            trigger={
                                                <Button type="button" variant="onDeep" size="sm">
                                                    <LogOut className="size-4" />
                                                    Sign out that device
                                                </Button>
                                            }
                                            title="Sign the board out?"
                                            description="Whoever is holding it loses control immediately. Anyone with the session ID and key can then open it."
                                            confirmLabel="Sign out"
                                            variant="destructive"
                                            onConfirm={() =>
                                                router.post(`/open-play/${activeSession.id}/release-board`, {}, { preserveScroll: true })
                                            }
                                        />
                                    )}
                                </div>
                            </section>

                            <section>
                                <h2 className="text-h2 text-foreground mb-3">On court now</h2>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    {liveMatches.map((match) => (
                                        <article key={match.id} className="border-border bg-surface overflow-hidden rounded-xl border">
                                            <div className="border-border bg-surface-muted flex items-center justify-between gap-3 border-b px-4 py-2">
                                                <p className="text-label text-foreground font-semibold">{match.court}</p>
                                                <p className="text-meta text-muted">
                                                    round <span data-numeric>{match.round}</span>
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4">
                                                <Team players={match.teams?.one ?? []} score={match.team_one_score} />
                                                <span className="text-meta text-muted">vs</span>
                                                <Team players={match.teams?.two ?? []} score={match.team_two_score} align="right" />
                                            </div>

                                            <div className="border-border border-t px-4 py-3">
                                                {/* Releasing the court is the only manual step
                                                    left: the next match assigns itself. */}
                                                <Button type="button" variant="outline" className="w-full" onClick={() => releaseCourt(match.id)}>
                                                    <RotateCw className="size-4" />
                                                    Finish match, rotate next
                                                </Button>
                                            </div>
                                        </article>
                                    ))}

                                    {idleCourts.map((court: any) => (
                                        <article key={court.id} className="border-border rounded-xl border border-dashed px-4 py-8 text-center">
                                            <p className="text-label text-foreground font-semibold">{court.name}</p>
                                            <p className="text-meta text-muted mt-1">
                                                {waiting.length >= 4
                                                    ? 'Assigning next match…'
                                                    : `Idle · ${4 - waiting.length} more ${4 - waiting.length === 1 ? 'player' : 'players'} needed`}
                                            </p>
                                        </article>
                                    ))}

                                    {sessionCourts.length === 0 && (
                                        <p className="border-border text-label text-muted col-span-full rounded-xl border border-dashed px-5 py-8 text-center">
                                            No courts on this session.
                                        </p>
                                    )}
                                </div>
                            </section>

                            <section>
                                <div className="mb-3 flex items-baseline justify-between gap-3">
                                    <h2 className="text-h2 text-foreground">Up next</h2>
                                    <p className="text-meta text-muted">In the order the rotation will call them</p>
                                </div>

                                {waiting.length === 0 ? (
                                    <p className="border-border text-label text-muted rounded-xl border border-dashed px-5 py-8 text-center">
                                        Nobody waiting. Players are added on the board with ID {activeSession.session_code} and its key.
                                    </p>
                                ) : (
                                    /* Capped so a queue of twenty does not push the
                                       session list off the bottom of the page. */
                                    <ul className="divide-border border-border bg-surface max-h-80 divide-y overflow-y-auto rounded-xl border">
                                        {waiting.map((entry, index) => (
                                            <li key={entry.player_id} className="flex items-center gap-3 px-4 py-2.5">
                                                <span
                                                    data-numeric
                                                    className={cn(
                                                        'text-meta flex size-7 shrink-0 items-center justify-center rounded-full font-semibold',
                                                        canCall && index < 4 ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-muted',
                                                    )}
                                                >
                                                    {index + 1}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-label text-foreground truncate font-medium">{entry.name}</p>
                                                    <p className="text-meta text-muted">
                                                        <span data-numeric>{entry.games}</span> {entry.games === 1 ? 'game' : 'games'}
                                                    </p>
                                                </div>
                                                {canCall && index < 4 && <span className="text-meta text-primary shrink-0 font-medium">next up</span>}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </>
                    ) : (
                        <section className="border-border rounded-xl border border-dashed px-5 py-16 text-center">
                            <p className="text-h3 text-foreground">No open play yet</p>
                            <p className="text-meta text-muted mx-auto mt-1 max-w-sm">
                                Start one and share its ID and key with whoever is running the court.
                            </p>
                            <Button className="mt-4" onClick={() => setCreating(true)}>
                                <Plus className="size-4" />
                                Start a session
                            </Button>
                        </section>
                    )}
                </div>

                {/* ---- Sessions, and the way to make one ------------------------- */}
                <aside className="min-w-0">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 className="text-h2 text-foreground">Sessions</h2>
                        <Button size="sm" onClick={() => setCreating(true)}>
                            <Plus className="size-4" />
                            New
                        </Button>
                    </div>

                    {activeSession && collections && (
                        <div className="mb-5">
                            {/* Taking money is staff work, so it lives here and
                                not on the board that runs on the session key. */}
                            <div className="mb-2 flex items-baseline justify-between gap-3">
                                <h2 className="text-h2 text-foreground">Collect</h2>
                                <p className="text-meta text-muted">{activeSession.session_code}</p>
                            </div>
                            <div className="flex max-h-96 flex-col">
                                <CollectionsPanel sessionId={activeSession.id} sheet={collections} />
                            </div>
                        </div>
                    )}

                    <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-xl border">
                        {sessions.data.map((session: any) => {
                            const current = activeSession && session.id === activeSession.id;

                            return (
                                <li key={session.id}>
                                    {/* Picking one drives the whole left side, so a club
                                        can check on a session without leaving the page. */}
                                    <Link
                                        href={`/open-play?session=${session.session_code}`}
                                        preserveScroll
                                        className={cn(
                                            'hover:bg-surface-muted flex items-start gap-3 px-4 py-3 transition-colors',
                                            current && 'bg-primary-soft',
                                        )}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-label text-foreground truncate font-medium">{session.name}</p>
                                            <p data-numeric className="text-meta text-primary mt-0.5 font-semibold">
                                                {session.session_code}
                                                {session.session_key && <span className="text-muted"> · {session.session_key}</span>}
                                            </p>
                                            <p className="text-meta text-muted mt-0.5 truncate">
                                                {session.branch?.name} · <span data-numeric>{session.players_count}</span> joined ·{' '}
                                                {currency(session.entry_fee)}
                                            </p>
                                            {session.start_time && (
                                                <p data-numeric className="text-meta text-muted">
                                                    {time12h(session.start_time)}–{time12h(session.end_time)}
                                                </p>
                                            )}
                                        </div>
                                        <StatusBadge status={session.status} />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </aside>
            </div>

            <SessionCreateDialog open={creating} onOpenChange={setCreating} branches={branches} />
        </AppLayout>
    );
}

function Team({ players, score, align = 'left' }: { players: any[]; score: number; align?: 'left' | 'right' }) {
    return (
        <div className={cn('min-w-0', align === 'right' && 'text-right')}>
            {players.map((player) => (
                <p key={player.id} className="text-label text-foreground truncate font-medium">
                    {player.name}
                </p>
            ))}
            <p data-numeric className="text-h2 text-foreground mt-1">
                {score}
            </p>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="bg-surface-deep px-3 py-2.5">
            <dt className="truncate text-[0.6875rem] tracking-wide text-white/45 uppercase">{label}</dt>
            <dd data-numeric className="mt-0.5 text-lg leading-none font-semibold text-white">
                {value}
            </dd>
        </div>
    );
}
