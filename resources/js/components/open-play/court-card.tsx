import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Minus, Trophy } from 'lucide-react';
import { useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payload from PublicOpenPlayBoardController. */

/**
 * One court.
 *
 * Tapping a team adds their point. Finishing asks who won rather than assuming
 * the scoreboard is the whole story, so a game called on court is recorded the
 * same way as one played out to the target.
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
                />
                <TeamScore
                    players={two}
                    score={match.team_two_score}
                    onScore={() => post(`${base}/matches/${match.id}/score`, { team: 'team_two' })}
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
                <div className="border-border flex shrink-0 gap-2 border-t px-3 py-3">
                    <Button
                        type="button"
                        variant="ghost"
                        size="iconTouch"
                        aria-label="Undo last point"
                        className="shrink-0"
                        onClick={() => post(`${base}/matches/${match.id}/undo`)}
                    >
                        <Minus className="size-4" />
                    </Button>
                    <Button type="button" variant="outline" size="touch" className="flex-1" onClick={() => setConfirming(true)}>
                        <Trophy className="size-4" />
                        Finish match
                    </Button>
                </div>
            )}
        </article>
    );
}

function TeamScore({ players, score, onScore }: { players: any[]; score: number; onScore: () => void }) {
    return (
        <button
            type="button"
            onClick={onScore}
            aria-label={`Add a point for ${players.map((player: any) => player.name).join(' and ')}`}
            /* The whole half scores: a small "+1" is a miss on a tablet at
               arm's length across a court. */
            className="bg-surface hover:bg-primary-soft active:bg-primary-soft flex min-h-32 flex-col items-center justify-center gap-1 px-3 py-4 transition-colors sm:min-h-36 lg:min-h-40"
        >
            <span className="text-label text-secondary line-clamp-2 px-1 text-center leading-snug font-medium">
                {players.map((player: any) => player.name).join(' / ')}
            </span>
            <span data-numeric className="text-foreground text-[3rem] leading-none font-semibold sm:text-[4rem] lg:text-[5rem]">
                {score}
            </span>
            {/* Only while it is still nil all: once there are points on the
                board the instruction is noise. */}
            <span className={cn('text-meta text-muted transition-opacity', score > 0 && 'opacity-0')}>tap to score</span>
        </button>
    );
}
