import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payload from PublicOpenPlayBoardController. */

/** How long to wait for a second tap before deciding what the first one meant. */
const DOUBLE_TAP_MS = 300;

/**
 * One court.
 *
 * One tap on a team scores. Two quick taps take the point back. There is no
 * separate undo control: the score is the only thing on the card worth
 * touching, and a small button next to a very large target is the one you hit
 * by mistake reaching across a net post.
 *
 * Finishing asks who won rather than assuming the scoreboard is the whole
 * story, so a game called on court is recorded the same way as one played out
 * to the target.
 */
export function CourtCard({
    match,
    base,
    post,
    target,
    winByTwo,
}: {
    match: any;
    base: string;
    post: (url: string, data?: Record<string, string>, onFinish?: () => void) => void;
    target?: number;
    winByTwo?: boolean;
}) {
    const [confirming, setConfirming] = useState(false);

    const one = match.teams?.one ?? [];
    const two = match.teams?.two ?? [];
    const label = (players: any[]) => players.map((player: any) => player.name).join(' / ');

    return (
        <article className="border-border bg-surface flex h-full flex-col overflow-hidden rounded-xl border">
            <div className="border-border bg-surface-muted flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2">
                <p className="text-label text-foreground font-semibold">{match.court}</p>
                <p className="text-meta text-muted">
                    {target ? (
                        <>
                            to{' '}
                            <span data-numeric className="text-foreground font-semibold">
                                {target}
                            </span>
                            {winByTwo ? ' by 2' : ''}
                            <span className="mx-1.5">·</span>
                        </>
                    ) : null}
                    round <span data-numeric>{match.round}</span>
                </p>
            </div>

            <div className="bg-border grid min-h-0 flex-1 grid-cols-2 gap-px">
                <TeamScore
                    players={one}
                    score={match.team_one_score}
                    against={match.team_two_score}
                    target={target}
                    winByTwo={winByTwo}
                    onScore={(done) => post(`${base}/matches/${match.id}/score`, { team: 'team_one' }, done)}
                    onUndo={(done) => post(`${base}/matches/${match.id}/undo`, { team: 'team_one' }, done)}
                />
                <TeamScore
                    players={two}
                    score={match.team_two_score}
                    against={match.team_one_score}
                    target={target}
                    winByTwo={winByTwo}
                    onScore={(done) => post(`${base}/matches/${match.id}/score`, { team: 'team_two' }, done)}
                    onUndo={(done) => post(`${base}/matches/${match.id}/undo`, { team: 'team_two' }, done)}
                />
            </div>

            {confirming ? (
                <div className="border-border shrink-0 border-t px-3 py-3">
                    <p className="text-meta text-muted mb-2 text-center">Who won?</p>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            size="touch"
                            data-winner="one"
                            className="min-w-0"
                            onClick={() => post(`${base}/matches/${match.id}/finish`, { winner: 'one' })}
                        >
                            <span className="truncate">{label(one)}</span>
                        </Button>
                        <Button
                            type="button"
                            size="touch"
                            data-winner="two"
                            className="min-w-0"
                            onClick={() => post(`${base}/matches/${match.id}/finish`, { winner: 'two' })}
                        >
                            <span className="truncate">{label(two)}</span>
                        </Button>
                    </div>
                    <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => setConfirming(false)}>
                        Cancel
                    </Button>
                </div>
            ) : (
                <div className="border-border shrink-0 border-t px-3 py-3">
                    <Button type="button" variant="outline" size="touch" className="w-full" onClick={() => setConfirming(true)}>
                        <Trophy className="size-4" />
                        Finish match
                    </Button>
                </div>
            )}
        </article>
    );
}

function TeamScore({
    players,
    score,
    against,
    target,
    winByTwo,
    onScore,
    onUndo,
}: {
    players: any[];
    score: number;
    against: number;
    target?: number;
    winByTwo?: boolean;
    onScore: (done: () => void) => void;
    onUndo: (done: () => void) => void;
}) {
    const taps = useRef(0);
    const timer = useRef<number | undefined>(undefined);
    const [pending, setPending] = useState(0);
    const reduce = useReducedMotion();

    useEffect(() => () => window.clearTimeout(timer.current), []);

    /*
     * The request waits for the double tap window to close, but the number does
     * not: `pending` moves the moment a finger lands and is only cleared once
     * the server has answered. Clearing it when the request went out instead
     * made the score drop back to the old value for the length of the round
     * trip and then jump forward again.
     */
    const tap = () => {
        taps.current += 1;
        setPending(taps.current === 1 ? 1 : -1);

        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
            const count = taps.current;
            taps.current = 0;

            const done = () => setPending(0);

            if (count === 1) {
                onScore(done);
            } else {
                onUndo(done);
            }
        }, DOUBLE_TAP_MS);
    };

    const shown = Math.max(0, score + pending);
    const leading = shown > against;
    const level = shown > 0 && shown === against;

    /* One more point wins it. Worth saying out loud on a court where nobody is
       watching the number closely. */
    const matchPoint = Boolean(target) && shown >= (target ?? 0) - 1 && shown + 1 - against >= (winByTwo ? 2 : 1);

    /* Progress to the target, so the game reads at a glance from the far side
       of the net rather than by comparing two numbers. */
    const progress = target ? Math.min(100, Math.round((shown / target) * 100)) : 0;

    return (
        <button
            type="button"
            onClick={tap}
            aria-label={`Score for ${players.map((player: any) => player.name).join(' and ')}. Tap to add a point, double tap to take one back.`}
            /* The whole half scores: a small "+1" is a miss on a tablet at
               arm's length across a court. */
            className="group bg-surface hover:bg-surface-muted active:bg-primary-soft relative flex h-full min-h-32 flex-col items-center justify-center gap-2 overflow-hidden px-3 py-4 transition-colors sm:min-h-36"
        >
            {/* The one effect on this screen: a soft bloom behind whichever
                number is ahead, so the lead reads from across a court without
                painting half the card. */}
            {leading && (
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(18rem 12rem at 50% 50%, color-mix(in srgb, var(--primary) 22%, transparent) 0%, transparent 70%)',
                    }}
                />
            )}

            <span className="text-label text-secondary relative line-clamp-2 px-1 text-center leading-snug font-medium">
                {players.map((player: any) => player.name).join(' / ')}
            </span>

            {/*
             * The number replaces itself rather than ticking over. A point in
             * pickleball is a discrete thing that just happened, and a rolling
             * counter reads as a value settling rather than a point being won.
             */}
            <span className="relative flex items-center justify-center" style={{ minHeight: '1em' }}>
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                        key={shown}
                        data-numeric
                        initial={reduce ? false : { opacity: 0, y: 14, scale: 0.82 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.82, position: 'absolute' }}
                        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 26 }}
                        className={cn(
                            'text-[3.25rem] leading-[0.85] font-semibold tracking-[-0.03em] tabular-nums sm:text-[4.5rem] lg:text-[5.5rem] 2xl:text-[6.5rem]',
                            leading ? 'text-primary' : 'text-foreground',
                        )}
                    >
                        {shown}
                    </motion.span>
                </AnimatePresence>
            </span>

            {/* A rail rather than a label: it fills as the game runs out. */}
            {target ? (
                <span aria-hidden className="bg-surface-muted relative h-1 w-16 overflow-hidden rounded-full sm:w-24 lg:w-28">
                    <motion.span
                        className={cn('absolute inset-y-0 left-0 rounded-full', leading ? 'bg-primary' : 'bg-border-strong')}
                        animate={{ width: `${progress}%` }}
                        transition={reduce ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    />
                </span>
            ) : null}

            <span className="relative flex h-4 items-center">
                {matchPoint ? (
                    <span className="text-primary text-[0.6875rem] font-semibold tracking-[0.14em] uppercase">match point</span>
                ) : level ? (
                    <span className="text-meta text-muted">all square</span>
                ) : (
                    /* Only while it is still nil all: once there are points on
                       the board the instruction is noise. */
                    <span className={cn('text-meta text-muted transition-opacity', (score > 0 || against > 0) && 'opacity-0')}>
                        tap to score · double tap to undo
                    </span>
                )}
            </span>
        </button>
    );
}
