import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
    post: (url: string, data?: Record<string, string>) => void;
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
                    onScore={() => post(`${base}/matches/${match.id}/score`, { team: 'team_one' })}
                    onUndo={() => post(`${base}/matches/${match.id}/undo`)}
                />
                <TeamScore
                    players={two}
                    score={match.team_two_score}
                    onScore={() => post(`${base}/matches/${match.id}/score`, { team: 'team_two' })}
                    onUndo={() => post(`${base}/matches/${match.id}/undo`)}
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

function TeamScore({ players, score, onScore, onUndo }: { players: any[]; score: number; onScore: () => void; onUndo: () => void }) {
    const taps = useRef(0);
    const timer = useRef<number | undefined>(undefined);
    const [pending, setPending] = useState(0);

    useEffect(() => () => window.clearTimeout(timer.current), []);

    /*
     * The request waits for the double tap window to close, but the number does
     * not: `pending` moves the moment a finger lands, so scoring still feels
     * instant while the second tap can still change what the first one meant.
     */
    const tap = () => {
        taps.current += 1;
        setPending(taps.current === 1 ? 1 : -1);

        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
            const count = taps.current;
            taps.current = 0;
            setPending(0);

            if (count === 1) {
                onScore();
            } else {
                onUndo();
            }
        }, DOUBLE_TAP_MS);
    };

    const shown = Math.max(0, score + pending);

    return (
        <button
            type="button"
            onClick={tap}
            aria-label={`Score for ${players.map((player: any) => player.name).join(' and ')}. Tap to add a point, double tap to take one back.`}
            /* The whole half scores: a small "+1" is a miss on a tablet at
               arm's length across a court. */
            className="bg-surface hover:bg-primary-soft active:bg-primary-soft flex h-full min-h-32 flex-col items-center justify-center gap-1 px-3 py-4 transition-colors sm:min-h-36"
        >
            <span className="text-label text-secondary line-clamp-2 px-1 text-center leading-snug font-medium">
                {players.map((player: any) => player.name).join(' / ')}
            </span>
            <span data-numeric className="text-foreground text-[3rem] leading-none font-semibold sm:text-[4rem] lg:text-[5rem]">
                {shown}
            </span>
            {/* Only while it is still nil all: once there are points on the
                board the instruction is noise. */}
            <span className={cn('text-meta text-muted transition-opacity', score > 0 && 'opacity-0')}>tap to score · double tap to undo</span>
        </button>
    );
}
