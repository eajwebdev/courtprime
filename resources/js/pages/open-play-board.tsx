import { ConfirmDialog } from '@/components/confirm-dialog';
import { FlashToast } from '@/components/flash-toast';
import { ActivityFeed, type ActivityEntry } from '@/components/open-play/activity-feed';
import { BoardHeader } from '@/components/open-play/board-header';
import { BoardRail } from '@/components/open-play/board-rail';
import { CourtCard } from '@/components/open-play/court-card';
import { RosterPanel, type RosterEntry } from '@/components/open-play/roster-panel';
import { SessionSetup, type BoardCourt } from '@/components/open-play/session-setup';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Head, router, usePage } from '@inertiajs/react';
import { Check, Circle, Loader2, Play, X } from 'lucide-react';
import { useEffect, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payload from PublicOpenPlayBoardController. */

type Props = {
    session: any;
    inControl: boolean;
    courts: BoardCourt[];
    branchCourts: BoardCourt[];
    roster: RosterEntry[];
    liveMatches: any[];
    waiting: any[];
    results: any[];
    activity: ActivityEntry[];
};

/**
 * The board the players run.
 *
 * One device holds it at a time. The ID and key are the controls rather than an
 * invitation, so entering them takes the board and does not put anyone in the
 * rotation; the holder adds players here.
 *
 * Two screens in one, decided by whether the session has started. Before:
 * choose courts, set what a win is, add everyone who turned up. After: the
 * courts, the queue and the scores.
 *
 * Sized for a tablet propped up at the net post, which is the device this is
 * actually used on. Nothing important is behind a menu, targets are at least
 * 48px, and the layout gets wider rather than taller as the screen grows, so a
 * tablet in landscape shows the whole session without scrolling.
 */
export default function OpenPlayBoard({ session, inControl, courts, branchCourts, roster, liveMatches, waiting, results, activity }: Props) {
    const [showActivity, setShowActivity] = useState(false);
    const [confirmRelease, setConfirmRelease] = useState(false);
    const { errors } = usePage().props as any;
    const base = `/open-play/${session.session_code}`;
    const started = Boolean(session.started);

    /*
     * Several phones and a tablet can all be looking at this at once, so the
     * board refetches rather than assuming it is the only thing changing the
     * score.
     */
    useEffect(() => {
        const timer = window.setInterval(() => {
            /* A partial reload: `reload` already preserves component state and
               scroll, so a refresh landing while someone is half way through
               typing a name leaves what they have typed alone. */
            router.reload({ only: ['liveMatches', 'waiting', 'results', 'session', 'roster', 'activity'] });
        }, 8000);

        return () => window.clearInterval(timer);
    }, []);

    /* `onFinish` matters for scoring: the card holds its optimistic number
       until the server has answered, so the score never drops back before it
       jumps forward. */
    const post = (url: string, data: Record<string, string> = {}, onFinish?: () => void) =>
        router.post(url, data, { preserveScroll: true, preserveState: true, onFinish });

    return (
        /*
         * Deliberately not the staff shell. The people running this are the
         * players on the court, reached by the session code, so there is no
         * workspace sidebar and nothing to navigate away into.
         */
        /*
         * One screen, no page scroll.
         *
         * From lg up the shell is exactly the viewport height and every list
         * scrolls inside its own card, so the courts, the roster and the queue
         * stay where they were put. A phone cannot honour that without hiding
         * something, so below lg the page scrolls normally.
         */
        <div className="bg-background text-foreground flex min-h-svh flex-col lg:h-svh lg:overflow-hidden">
            <Head title={`${session.session_code} · ${session.name} | CourtPrime`} />

            <BoardHeader
                session={session}
                inControl={inControl}
                activityCount={activity.length}
                onShowActivity={() => setShowActivity(true)}
                onRelease={() => setConfirmRelease(true)}
            />

            <main
                className={cn(
                    'mx-auto w-full max-w-[120rem] flex-1 px-4 py-5 sm:px-6 lg:min-h-0 lg:overflow-hidden lg:px-8',
                    started ? 'pb-10 lg:pb-5' : 'pb-32 lg:pb-5',
                )}
            >
                {started ? (
                    <LiveBoard
                        base={base}
                        session={session}
                        courts={courts}
                        roster={roster}
                        liveMatches={liveMatches}
                        waiting={waiting}
                        results={results}
                        activity={activity}
                        post={post}
                    />
                ) : (
                    <SessionSetup
                        base={base}
                        session={session}
                        branchCourts={branchCourts}
                        selectedCourtIds={courts.map((court) => court.id)}
                        history={
                            <div className="border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border">
                                <ActivityFeed entries={activity} />
                            </div>
                        }
                    >
                        <RosterPanel base={base} roster={roster} />
                    </SessionSetup>
                )}
            </main>

            {!started && (
                <StartBar
                    base={base}
                    courts={courts.length}
                    players={roster.length}
                    /* Singles needs two on a court, doubles four. */
                    needed={session.format === 'singles' ? 2 : 4}
                    error={errors?.start}
                />
            )}

            <ActivityPanel open={showActivity} onClose={() => setShowActivity(false)} entries={activity} />

            {/* The board's own dialog rather than the browser's, which showed
                the host name and looked like a phishing prompt on a tablet. */}
            <ConfirmDialog
                open={confirmRelease}
                onOpenChange={setConfirmRelease}
                title="Release the board?"
                description="This device stops being able to change the session. Anyone with the session ID and key can then take it."
                confirmLabel="Release board"
                variant="destructive"
                onConfirm={() => router.post(`${base}/release`)}
            />

            <FlashToast />
        </div>
    );
}

/** Courts, queue and standings, once the session is running. */
function LiveBoard({
    base,
    session,
    courts,
    roster,
    liveMatches,
    waiting,
    results,
    activity,
    post,
}: {
    base: string;
    session: any;
    courts: BoardCourt[];
    roster: RosterEntry[];
    liveMatches: any[];
    waiting: any[];
    results: any[];
    activity: ActivityEntry[];
    post: (url: string, data?: Record<string, string>, onFinish?: () => void) => void;
}) {
    const busy = liveMatches.map((match) => match.court);
    const idle = courts.filter((court) => !busy.includes(court.name));
    const perMatch = session.format === 'singles' ? 2 : 4;
    const needed = Math.max(0, perMatch - waiting.length);

    /*
     * The grid follows the number of courts rather than the breakpoint. A club
     * running one court was getting a half width card with a big empty space
     * beside it, on the tablet where the score has to be readable and tappable
     * from the net post.
     */
    const courtGrid = courts.length <= 1 ? 'grid-cols-1' : courts.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 2xl:grid-cols-3';

    return (
        <div className="grid gap-4 lg:h-full lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="flex min-h-0 flex-col gap-3">
                {/* The status line is its own row. Left inside the court grid it
                    was handed an equal-height track and floated in mid air. */}
                <div className="text-meta text-muted flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1">
                    <span>
                        Round{' '}
                        <span data-numeric className="text-foreground font-semibold">
                            {session.current_round}
                        </span>
                    </span>
                    <span className="capitalize">{session.format ?? 'doubles'}</span>
                    <span>
                        Games to{' '}
                        <span data-numeric className="text-foreground font-semibold">
                            {session.target_score}
                        </span>
                        {session.win_by_two ? ', win by 2' : ''}
                    </span>
                    <span>
                        <span data-numeric className="text-foreground font-semibold">
                            {roster.length}
                        </span>{' '}
                        checked in
                    </span>
                </div>

                <div className={cn('grid content-start gap-4 lg:min-h-0 lg:flex-1 lg:auto-rows-fr lg:overflow-y-auto', courtGrid)}>
                    {liveMatches.map((match) => (
                        <CourtCard key={match.id} match={match} base={base} post={post} target={session.target_score} winByTwo={session.win_by_two} />
                    ))}

                    {idle.map((court) => (
                        <article
                            key={court.id}
                            className="border-border flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center"
                        >
                            <p className="text-label text-foreground font-semibold">{court.name}</p>
                            <p className="text-meta text-muted mt-1">
                                {needed === 0 ? 'Assigning next match…' : `Idle · ${needed} more ${needed === 1 ? 'player' : 'players'} needed`}
                            </p>
                        </article>
                    ))}

                    {courts.length === 0 && (
                        <p className="border-border text-label text-muted col-span-full rounded-xl border border-dashed px-5 py-10 text-center">
                            No courts in play.
                        </p>
                    )}
                </div>
            </div>

            <BoardRail base={base} roster={roster} waiting={waiting} results={results} activity={activity} needed={needed} />
        </div>
    );
}

/**
 * What is still missing before the first match can be drawn.
 *
 * Fixed to the bottom because on a tablet the person setting up is looking at
 * the list of names, not at the top of the page, and the answer to "why can't I
 * start" has to be where their eyes already are.
 */
function StartBar({ base, courts, players, needed, error }: { base: string; courts: number; players: number; needed: number; error?: string }) {
    const [starting, setStarting] = useState(false);
    const ready = courts >= 1 && players >= needed;

    const start = () => {
        setStarting(true);
        router.post(`${base}/start`, {}, { preserveScroll: true, onFinish: () => setStarting(false) });
    };

    return (
        <div className="border-border bg-surface/95 z-sticky sticky bottom-0 border-t backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-[120rem] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
                <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <Requirement met={courts >= 1} label={courts === 1 ? '1 court' : `${courts} courts`} />
                    <Requirement met={players >= needed} label={`${players}/${needed} players`} />
                </ul>

                <div className="flex items-center gap-3">
                    {error && (
                        <p role="alert" className="text-meta text-danger">
                            {error}
                        </p>
                    )}
                    <Button type="button" size="touch" onClick={start} disabled={!ready || starting} className="min-w-40">
                        {starting ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                        Start session
                    </Button>
                </div>
            </div>
        </div>
    );
}

function Requirement({ met, label }: { met: boolean; label: string }) {
    return (
        <li className={cn('text-meta flex items-center gap-1.5 font-medium', met ? 'text-success' : 'text-muted')}>
            {met ? <Check className="size-3.5" aria-hidden /> : <Circle className="size-3.5" aria-hidden />}
            <span data-numeric>{label}</span>
        </li>
    );
}

/** History, as a slide-over so it costs no width until someone asks for it. */
function ActivityPanel({ open, onClose, entries }: { open: boolean; onClose: () => void; entries: ActivityEntry[] }) {
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    if (!open) return null;

    return (
        <div className="z-drawer fixed inset-0">
            <button type="button" aria-label="Close history" onClick={onClose} className="absolute inset-0 bg-black/50" />
            <div className="bg-surface shadow-e3 absolute inset-y-0 right-0 flex w-full max-w-md flex-col">
                <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
                    <p className="text-h3 text-foreground">Session history</p>
                    <Button type="button" variant="ghost" size="iconSm" aria-label="Close" onClick={onClose}>
                        <X className="size-4" />
                    </Button>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden">
                    <ActivityFeed entries={entries} hideHeader />
                </div>
                <p className="border-border text-meta text-muted border-t px-4 py-3">
                    Everyone with the session ID and key can run this board. Every change is listed here.
                </p>
            </div>
        </div>
    );
}
