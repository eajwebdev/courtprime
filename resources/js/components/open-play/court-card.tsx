import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Ban, Loader2, Shuffle, Trophy, Undo2, UserRoundPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payload from PublicOpenPlayBoardController. */

/**
 * How far a finger has to travel left before it is a swipe rather than a tap.
 *
 * Generous, because this is used at arm's length on a tablet propped at a net
 * post: a deliberate swipe clears it easily and a tap that slides a little
 * still scores.
 */
const SWIPE_BACK_PX = 44;

/**
 * One court.
 *
 * A tap on a team scores; dragging that half to the left takes the point back.
 * There is no separate undo control: the score is the only thing on the card
 * worth touching, and a small button next to a very large target is the one you
 * hit by mistake reaching across a net post.
 *
 * A court is scored by one device. When it belongs to somebody else the card
 * still shows the game — everyone standing around wants to see it — but it
 * cannot be tapped, and it says who has it.
 *
 * A game played out to the target finishes itself, and nobody is asked who won
 * a game the score already settled. Finishing early asks only when the score
 * cannot answer it, which is when the sides are level.
 *
 * Teams are drawn automatically and can be rearranged before the first point,
 * because a court full of regulars will want to fix the pairings themselves.
 */
export function CourtCard({
    match,
    base,
    post,
    target,
    winByTwo,
    waiting = [],
    mine = true,
    heldBy = null,
    courtId,
}: {
    match: any;
    base: string;
    post: (url: string, data?: Record<string, string>, onFinish?: () => void) => void;
    target?: number;
    winByTwo?: boolean;
    /** The queue, so a player can be swapped in from it before the first point. */
    waiting?: any[];
    /** Whether this device is the one scoring this court. */
    mine?: boolean;
    /** Who has it, when somebody else does. */
    heldBy?: string | null;
    /** For taking the court, when it is free. */
    courtId?: number;
}) {
    const [confirming, setConfirming] = useState(false);
    const [arranging, setArranging] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const one = match.teams?.one ?? [];
    const two = match.teams?.two ?? [];
    const label = (players: any[]) => players.map((player: any) => player.name).join(' / ');

    const scoreOne = match.team_one_score ?? 0;
    const scoreTwo = match.team_two_score ?? 0;
    const started = scoreOne > 0 || scoreTwo > 0;
    const level = scoreOne === scoreTwo;

    /*
     * The score answers "who won" unless the sides are level, so finishing
     * early only asks when it genuinely cannot be read off the board.
     */
    const finish = () => {
        if (level) {
            setConfirming(true);

            return;
        }

        post(`${base}/matches/${match.id}/finish`, { winner: scoreOne > scoreTwo ? 'one' : 'two' });
    };

    return (
        <article className="border-border bg-surface flex h-full flex-col overflow-hidden rounded-xl border">
            <div className="border-border bg-surface-muted flex shrink-0 items-center justify-between gap-2 border-b px-3 py-1.5">
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

                {/* Only before the first point: moving somebody across the net
                    mid game would leave points against a team they were not
                    on. And only for whoever is scoring this court. */}
                {mine && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        disabled={started}
                        title={started ? 'Take the points back to rearrange' : 'Rearrange the teams'}
                        onClick={() => setArranging(true)}
                    >
                        <Shuffle className="size-4" />
                        <span className="hidden sm:inline">Teams</span>
                    </Button>
                )}
            </div>

            {/* Whose court this is, when it is not yours. A number that cannot
                be tapped needs to say why before somebody taps it twice. */}
            {!mine && (
                <div className="border-border text-meta text-muted flex shrink-0 items-center justify-between gap-2 border-b px-3 py-1.5">
                    <span className="truncate">{heldBy ? `${heldBy} is scoring this court` : 'Nobody is scoring this court'}</span>
                    {!heldBy && courtId && (
                        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => post(`${base}/courts/${courtId}/claim`)}>
                            Score this court
                        </Button>
                    )}
                </div>
            )}

            <div className={cn('bg-border grid min-h-0 flex-1 grid-cols-2 gap-px', !mine && 'pointer-events-none opacity-70')}>
                <TeamScore
                    side="Team A"
                    players={one}
                    score={match.team_one_score}
                    against={match.team_two_score}
                    target={target}
                    winByTwo={winByTwo}
                    readOnly={!mine}
                    onScore={(done) => post(`${base}/matches/${match.id}/score`, { team: 'team_one' }, done)}
                    onUndo={(done) => post(`${base}/matches/${match.id}/undo`, { team: 'team_one' }, done)}
                />
                <TeamScore
                    side="Team B"
                    players={two}
                    score={match.team_two_score}
                    against={match.team_one_score}
                    target={target}
                    winByTwo={winByTwo}
                    readOnly={!mine}
                    onScore={(done) => post(`${base}/matches/${match.id}/score`, { team: 'team_two' }, done)}
                    onUndo={(done) => post(`${base}/matches/${match.id}/undo`, { team: 'team_two' }, done)}
                />
            </div>

            {!mine ? null : confirming ? (
                <div className="border-border shrink-0 border-t px-3 py-3">
                    <p className="text-meta text-muted mb-2 text-center">Level at {scoreOne}. Who won?</p>
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
                <div className="border-border flex shrink-0 items-center gap-2 border-t px-3 py-3">
                    <Button type="button" variant="outline" size="touch" className="min-w-0 flex-1" onClick={finish}>
                        <Trophy className="size-4" />
                        {/* Says what will happen: a decided game is recorded, a
                            level one asks. */}
                        <span className="truncate">{level ? 'End game early' : `Finish · ${scoreOne > scoreTwo ? 'Team A' : 'Team B'} wins`}</span>
                    </Button>

                    {/* Voiding is not finishing. A game called off never
                        happened: nobody is credited with it and nobody's streak
                        moves, which finishing at nil-nil would get wrong. */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="touch"
                        className="shrink-0"
                        aria-label="Cancel this game"
                        title="Cancel this game"
                        onClick={() => setCancelling(true)}
                    >
                        <Ban className="size-4" />
                    </Button>
                </div>
            )}

            <ArrangeTeams open={arranging} onOpenChange={setArranging} base={base} match={match} one={one} two={two} waiting={waiting} />

            <ConfirmDialog
                open={cancelling}
                onOpenChange={setCancelling}
                title={`Cancel the game on ${match.court}?`}
                description="It counts for nobody: no game played, no streak, no result. Everyone on the court goes back into the queue behind whoever is already waiting."
                confirmLabel="Cancel game"
                variant="destructive"
                onConfirm={() => post(`${base}/matches/${match.id}/cancel`)}
            />
        </article>
    );
}

function TeamScore({
    side,
    players,
    score,
    against,
    target,
    winByTwo,
    readOnly = false,
    onScore,
    onUndo,
}: {
    /** Team A or Team B, which is how the arrange screen names them. */
    side: string;
    players: any[];
    score: number;
    against: number;
    target?: number;
    winByTwo?: boolean;
    /** Somebody else is scoring this court; the number is here to read only. */
    readOnly?: boolean;
    onScore: (done: () => void) => void;
    onUndo: (done: () => void) => void;
}) {
    const startX = useRef<number | null>(null);
    const [pending, setPending] = useState(0);
    const [dragging, setDragging] = useState(0);
    const reduce = useReducedMotion();

    /*
     * A tap scores; dragging left takes the point back.
     *
     * It used to be tap to score and double tap to undo, which meant every
     * single point waited 300ms to find out whether a second finger was
     * coming — on the one control that gets used a hundred times a night. A
     * point now lands the instant it is tapped, and taking one back is a
     * gesture that cannot happen by accident.
     *
     * `pending` moves the moment the finger lifts and is only cleared once the
     * server has answered, so the number never drops back to the old value for
     * the length of the round trip and then jumps forward again.
     */
    const down = (event: React.PointerEvent) => {
        if (readOnly) return;

        startX.current = event.clientX;
        setDragging(0);
    };

    const move = (event: React.PointerEvent) => {
        if (startX.current === null) return;

        /* Only leftward travel counts, and only far enough to be deliberate. */
        setDragging(Math.min(0, event.clientX - startX.current));
    };

    const up = (event: React.PointerEvent) => {
        if (startX.current === null) return;

        const travelled = event.clientX - startX.current;
        startX.current = null;
        setDragging(0);

        const done = () => setPending(0);

        if (travelled <= -SWIPE_BACK_PX) {
            if (score <= 0) return;

            setPending(-1);
            onUndo(done);

            return;
        }

        setPending(1);
        onScore(done);
    };

    const cancel = () => {
        startX.current = null;
        setDragging(0);
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

    /* Far enough left to be reading as a take-back rather than a slip. */
    const undoing = dragging <= -SWIPE_BACK_PX && score > 0;

    return (
        <button
            type="button"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={cancel}
            onPointerLeave={cancel}
            /* Pointer events cover mouse, pen and touch, but not the keyboard:
               Enter and Space fire click and nothing else, so scoring stays
               reachable without a pointer at all. */
            onClick={(event) => {
                /* detail 0 is a keyboard activation; a real click has already
                   been handled by the pointer sequence above. */
                if (readOnly || event.detail !== 0) return;

                setPending(1);
                onScore(() => setPending(0));
            }}
            disabled={readOnly}
            aria-label={
                readOnly
                    ? `${players.map((player: any) => player.name).join(' and ')}, scored by somebody else`
                    : `Score for ${players.map((player: any) => player.name).join(' and ')}. Tap to add a point, drag left to take one back.`
            }
            /* The whole half scores: a small "+1" is a miss on a tablet at
               arm's length across a court. `touch-action` keeps the browser
               from claiming a horizontal drag as a scroll before we see it. */
            className={cn(
                'group bg-surface hover:bg-surface-muted active:bg-primary-soft relative flex h-full min-h-32 touch-pan-y flex-col items-center justify-center gap-2 overflow-hidden px-3 py-4 transition-colors select-none sm:min-h-36',
                undoing && 'bg-danger-soft',
            )}
            style={{ transform: dragging < 0 ? `translateX(${Math.max(dragging / 3, -24)}px)` : undefined }}
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

            <span className="relative flex flex-col items-center gap-0.5">
                <span className="text-muted text-[0.625rem] font-semibold tracking-[0.14em] uppercase">{side}</span>
                <span className="text-label text-secondary line-clamp-2 px-1 text-center leading-snug font-medium">
                    {players.map((player: any) => player.name).join(' / ')}
                </span>
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
                {/* While a finger is travelling left, the label says what
                    letting go will do — the gesture is not discoverable on its
                    own, and this is where the eyes already are. */}
                {dragging < 0 ? (
                    <span className={cn('text-[0.6875rem] font-semibold tracking-[0.14em] uppercase', undoing ? 'text-danger' : 'text-muted')}>
                        {undoing ? 'release to take back' : 'keep dragging'}
                    </span>
                ) : matchPoint ? (
                    <span className="text-primary text-[0.6875rem] font-semibold tracking-[0.14em] uppercase">match point</span>
                ) : level ? (
                    <span className="text-meta text-muted">all square</span>
                ) : (
                    /* Only while it is still nil all: once there are points on
                       the board the instruction is noise. */
                    <span className={cn('text-meta text-muted transition-opacity', (score > 0 || against > 0) && 'opacity-0')}>
                        tap to score · drag left to undo
                    </span>
                )}
            </span>
        </button>
    );
}

/**
 * Putting people on the side you want them.
 *
 * Team A and Team B rather than the pair of names, because the point of this
 * screen is moving somebody from one to the other, and a name is what you drag,
 * not where you drop it.
 */
function ArrangeTeams({
    open,
    onOpenChange,
    base,
    match,
    one,
    two,
    waiting = [],
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    base: string;
    match: any;
    one: any[];
    two: any[];
    waiting?: any[];
}) {
    const [teams, setTeams] = useState<Record<number, 'one' | 'two'>>({});
    /* Keyed by who is on the court, valued by who takes their place. */
    const [swaps, setSwaps] = useState<Record<number, number>>({});
    const [swapping, setSwapping] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    /* Reseed each time it opens, so a poll landing underneath does not move
       somebody while the sides are being decided. */
    useEffect(() => {
        if (!open) return;

        const next: Record<number, 'one' | 'two'> = {};
        one.forEach((player: any) => (next[player.id] = 'one'));
        two.forEach((player: any) => (next[player.id] = 'two'));
        setTeams(next);
        setSwaps({});
        setSwapping(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const players = [...one, ...two];
    const perSide = Math.max(1, Math.floor(players.length / 2));
    const onA = Object.values(teams).filter((side) => side === 'one').length;
    const even = onA === perSide;

    /* Nobody can be brought on twice in one go. */
    const taken = Object.values(swaps);
    const available = waiting.filter((entry: any) => !taken.includes(entry.player_id));
    const nameOf = (playerId: number) => waiting.find((entry: any) => entry.player_id === playerId)?.name ?? 'Player';

    const save = () => {
        setSaving(true);
        router.post(
            `${base}/matches/${match.id}/teams`,
            { teams, swaps },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => onOpenChange(false),
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Arrange {match.court}</DialogTitle>
                    <DialogDescription>
                        Tap a side to move a player, or swap one out for somebody waiting. Both sides have to end up even.
                    </DialogDescription>
                </DialogHeader>

                <ul className="space-y-2">
                    {players.map((player: any) => {
                        const swappedFor = swaps[player.id];

                        return (
                            <li key={player.id} className="flex items-center gap-2">
                                <span className="min-w-0 flex-1">
                                    <span
                                        className={cn(
                                            'text-label block truncate font-medium',
                                            swappedFor ? 'text-muted line-through' : 'text-foreground',
                                        )}
                                    >
                                        {player.name}
                                    </span>
                                    {swappedFor && <span className="text-meta text-primary block truncate">{nameOf(swappedFor)} comes on</span>}
                                </span>

                                {/* Swapping is only worth offering when there is
                                    somebody in the queue to swap for. */}
                                {(available.length > 0 || swappedFor) && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="iconSm"
                                        className="shrink-0"
                                        aria-label={swappedFor ? `Undo swapping ${player.name}` : `Swap ${player.name} out`}
                                        title={swappedFor ? 'Undo this swap' : 'Swap out for somebody waiting'}
                                        onClick={() => {
                                            if (swappedFor) {
                                                setSwaps((current) =>
                                                    Object.fromEntries(Object.entries(current).filter(([id]) => Number(id) !== player.id)),
                                                );
                                                setSwapping(null);

                                                return;
                                            }

                                            setSwapping(swapping === player.id ? null : player.id);
                                        }}
                                    >
                                        {swappedFor ? <Undo2 className="size-4" /> : <UserRoundPlus className="size-4" />}
                                    </Button>
                                )}

                                <div className="border-border bg-surface-muted grid shrink-0 grid-cols-2 gap-1 rounded-lg border p-1">
                                    {(['one', 'two'] as const).map((side) => (
                                        <button
                                            key={side}
                                            type="button"
                                            aria-pressed={teams[player.id] === side}
                                            onClick={() => setTeams((current) => ({ ...current, [player.id]: side }))}
                                            className={cn(
                                                'text-meta h-9 w-16 rounded-md font-medium transition-colors',
                                                teams[player.id] === side ? 'bg-primary text-primary-foreground' : 'text-muted hover:text-foreground',
                                            )}
                                        >
                                            {side === 'one' ? 'Team A' : 'Team B'}
                                        </button>
                                    ))}
                                </div>
                            </li>
                        );
                    })}
                </ul>

                {/* Who is available, in queue order, so the person picking can
                    see they are taking somebody out of turn if they are. */}
                {swapping !== null && (
                    <div className="border-border max-h-48 overflow-y-auto rounded-lg border">
                        <p className="border-border bg-surface-muted text-meta text-muted border-b px-3 py-2">Who comes on?</p>
                        <ul className="divide-border divide-y">
                            {available.map((entry: any) => (
                                <li key={entry.player_id}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSwaps((current) => ({ ...current, [swapping]: entry.player_id }));
                                            setSwapping(null);
                                        }}
                                        className="hover:bg-surface-muted flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors"
                                    >
                                        <span data-numeric className="text-meta text-muted w-5 shrink-0">
                                            {entry.position}
                                        </span>
                                        <span className="text-label text-foreground min-w-0 flex-1 truncate">{entry.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {Object.keys(swaps).length > 0 && (
                    <p className="text-meta text-muted">
                        Whoever comes off takes the spot in the queue of whoever comes on, so nobody else in the line moves.
                    </p>
                )}

                {!even && (
                    <p role="alert" className="text-meta text-danger">
                        {onA} on Team A, {players.length - onA} on Team B. They have to be even.
                    </p>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={save} disabled={!even || saving}>
                        {saving ? <Loader2 className="size-4 animate-spin" /> : 'Save teams'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
