import { doublesPortraits, TeamPortrait } from '@/components/marketing-artwork';
import { type ScoreboardPlayer } from '@/components/scoreboard/player-portrait';
import { DURATION, EASE } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';

/**
 * Whether a side should be drawn as one pair rather than as separate players.
 *
 * Only when it is a pair and nobody on it has uploaded a photo. A player who
 * put their own picture up gets shown as themselves — stock art must never
 * stand in front of a real face.
 */
export function isDefaultPair(players: ScoreboardPlayer[]): boolean {
    return players.length === 2 && players.every((player) => player.photos.length === 0);
}

/**
 * A doubles pair on the board: the team artwork for their composition, with
 * both names and ratings under it.
 *
 * The mixed set has two pieces, so a mixed pair alternates between them on the
 * same tick the singles portraits use. Men's and women's doubles have one piece
 * each and simply hold it — a cycle of one is a still image, not a stutter.
 */
export function ScoreboardTeam({
    players,
    tick,
    seed = 0,
    size = 'lg',
    className,
}: {
    players: ScoreboardPlayer[];
    tick: number;
    /**
     * Where this side starts in the sequence. The caller derives it from the
     * court and the side, so the two halves of a panel and the panels either
     * side of it never land on the same piece at the same moment. Seeding from
     * the players themselves was not enough: with two mixed pieces only the
     * parity of the seed matters, and two pairs can easily share it.
     */
    seed?: number;
    size?: 'md' | 'lg';
    className?: string;
}) {
    const reduce = useReducedMotion();
    const [broken, setBroken] = useState<string[]>([]);

    const art = doublesPortraits(players.map((player) => player.gender)).filter((piece) => !broken.includes(piece));

    /* Every piece failed to load: fall through to names alone rather than
       leaving a gap where the pair should be. */
    const src = art.length > 0 ? art[(tick + seed) % art.length] : null;

    /* Tall enough to carry a wall display: the pair is the subject of a live
       panel, not a thumbnail beside the score. */
    const frame = {
        md: 'h-24 sm:h-32 xl:h-40',
        lg: 'h-32 sm:h-44 xl:h-56 2xl:h-72',
    }[size];

    return (
        <div className={cn('flex min-w-0 flex-col items-center gap-2', className)}>
            {src && (
                <div className={cn('relative flex w-full items-end justify-center', frame)}>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={src}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: reduce ? 0 : DURATION.ui, ease: EASE }}
                            className="flex h-full w-full items-end justify-center"
                        >
                            <TeamPortrait
                                src={src}
                                className="h-full w-auto max-w-full"
                                sizes="(max-width: 768px) 30vw, 240px"
                                onError={() => setBroken((current) => (current.includes(src) ? current : [...current, src]))}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}

            <div className="flex w-full min-w-0 flex-col items-center gap-1">
                <p className="w-full min-w-0 truncate text-center text-[clamp(0.75rem,1.05vw,1.25rem)] leading-tight font-bold tracking-tight">
                    {players.map((player, index) => (
                        <span key={player.id}>
                            {index > 0 && <span className="text-white/30"> · </span>}
                            {player.first_name}
                            {player.last_initial && <span className="font-semibold text-white/45"> {player.last_initial}</span>}
                        </span>
                    ))}
                </p>

                {players.some((player) => player.rating !== null) && (
                    <span
                        data-numeric
                        className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[clamp(0.5625rem,0.7vw,0.8125rem)] leading-none font-semibold text-white/55 tabular-nums"
                    >
                        {players.map((player) => (player.rating === null ? '—' : player.rating.toFixed(2))).join(' · ')}
                    </span>
                )}
            </div>
        </div>
    );
}
