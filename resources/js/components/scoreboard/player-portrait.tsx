import { defaultPortraits, PlayerPortrait } from '@/components/marketing-artwork';
import { DURATION, EASE } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

export type ScoreboardPlayer = {
    id: number;
    first_name: string;
    last_initial: string | null;
    rating: number | null;
    skill_level: string | null;
    gender: string | null;
    /** Their own uploads. Empty falls back to the CourtPrime defaults. */
    photos: string[];
};

/**
 * A clock every portrait on the board shares.
 *
 * One interval for the whole screen rather than one per player: eight players
 * with their own timers drift apart within a minute and the board starts
 * flickering at random. A single tick keeps the cadence even, and each portrait
 * offsets its own position in the sequence so they never all show the same
 * stand-in at the same moment.
 */
export function usePortraitTick(seconds: number): number {
    const [tick, setTick] = useState(0);
    const reduce = useReducedMotion();

    useEffect(() => {
        /* Reduced motion means no looping animation at all, so the portrait
           chosen on the first render is the one that stays. */
        if (reduce) return;

        const timer = window.setInterval(() => setTick((current) => current + 1), Math.max(seconds, 4) * 1000);

        return () => window.clearInterval(timer);
    }, [seconds, reduce]);

    return tick;
}

/**
 * One player on the board: their portrait, cycling, with their name under it.
 *
 * Players who have uploaded photos cycle through their own; everyone else
 * cycles the CourtPrime stand-ins for their stated gender. The starting frame
 * is derived from the player id, so two players sharing the default set are
 * almost never showing the same picture at the same time.
 *
 * The portraits are transparent PNGs drawn in the navy/pink palette, so each
 * sits on its own dark disc — dropped onto anything light they would show their
 * matting fringe.
 */
export function ScoreboardPortrait({
    player,
    tick,
    size = 'md',
    className,
}: {
    player: ScoreboardPlayer;
    tick: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}) {
    const reduce = useReducedMotion();

    /*
     * A photo that will not load must never leave a hole on a wall display.
     * Storage can be offline, a file can be deleted behind the record, and the
     * screen has nobody standing at it to reload the page — so a portrait that
     * fails is struck off and the player falls back to the CourtPrime set.
     */
    const [broken, setBroken] = useState<string[]>([]);
    const uploaded = player.photos.filter((photo) => !broken.includes(photo));
    const photos = uploaded.length > 0 ? uploaded : defaultPortraits(player.gender);
    const src = photos[(tick + player.id) % photos.length];

    /*
     * The disc and the column that holds it are sized together. Setting them
     * apart is what let the portraits grow wider than their own column at large
     * viewports and overlap the player beside them.
     */
    const frame = {
        /* The queue column is wider than its disc so a four-letter name is not
           truncated to "Nico…" under it. */
        sm: { disc: 'size-12 sm:size-14', column: 'w-16 sm:w-20' },
        md: { disc: 'size-16 sm:size-20 xl:size-24', column: 'w-16 sm:w-20 xl:w-24' },
        lg: { disc: 'size-20 sm:size-28 xl:size-32 2xl:size-36', column: 'w-20 sm:w-28 xl:w-32 2xl:w-36' },
    }[size];

    return (
        <div className={cn('flex shrink-0 flex-col items-center gap-2', frame.column, className)}>
            <div
                className={cn(
                    'relative shrink-0 overflow-hidden rounded-full border border-white/15',
                    /* The art is transparent: this disc is the ground it needs. */
                    'bg-[radial-gradient(circle_at_50%_30%,color-mix(in_srgb,var(--primary)_28%,transparent),transparent_70%)]',
                    frame.disc,
                )}
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={src}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduce ? 0 : DURATION.ui, ease: EASE }}
                        className="absolute inset-0"
                    >
                        <PlayerPortrait
                            src={src}
                            className="size-full"
                            sizes="(max-width: 768px) 20vw, 180px"
                            onError={() => setBroken((current) => (current.includes(src) ? current : [...current, src]))}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex w-full min-w-0 flex-col items-center gap-1">
                {/* One line: the initial stacked under the first name read as a
                    second person on the board. */}
                <p className="w-full min-w-0 truncate text-center text-[clamp(0.75rem,1.05vw,1.25rem)] leading-tight font-bold tracking-tight">
                    {player.first_name}
                    {player.last_initial && <span className="font-semibold text-white/45"> {player.last_initial}</span>}
                </p>

                {/* The rating earns its place on a wall board: it is what the
                    people watching use to place a player they do not know. */}
                {size !== 'sm' && player.rating !== null && (
                    <span
                        data-numeric
                        className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[clamp(0.5625rem,0.7vw,0.8125rem)] leading-none font-semibold text-white/55 tabular-nums"
                    >
                        {player.rating.toFixed(2)}
                    </span>
                )}
            </div>
        </div>
    );
}
