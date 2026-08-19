import { BrandWordmark } from '@/components/marketing-artwork';
import { CourtPanel, type ScoreboardCourt } from '@/components/scoreboard/court-panel';
import { ScoreboardPortrait, usePortraitTick, type ScoreboardPlayer } from '@/components/scoreboard/player-portrait';
import { cn } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type Props = {
    branch: { id: number; name: string; address: string | null; organization: string | null };
    display: { brand: string; logo_url: string | null; announcement: string | null; portrait_seconds: number };
    courts: ScoreboardCourt[];
    waiting: ScoreboardPlayer[];
};

/** How often the board pulls fresh scores. */
const REFRESH_MS = 10000;

/** The venue's own clock, which is the one people in the room are looking at. */
function useClock(): string {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 30000);

        return () => window.clearInterval(timer);
    }, []);

    return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * The courtside screen for one branch.
 *
 * Built for a TV first: read from across a room, no chrome, no navigation, no
 * interaction — nobody walks up to this and taps it. Everything scales with the
 * viewport through `clamp()`, so the same page is legible on a 4K wall panel and
 * on the phone of somebody checking whether a court has freed up.
 *
 * It polls rather than holding a socket open. A screen that has been on for
 * three days has to recover from the venue's wifi dropping without anybody
 * noticing it did, and a request every ten seconds always heals; a dead socket
 * needs someone to walk over and reload the TV.
 */
export default function BranchScoreboard({ branch, display, courts, waiting }: Props) {
    const clock = useClock();
    const tick = usePortraitTick(display.portrait_seconds);

    useEffect(() => {
        const timer = window.setInterval(() => {
            router.reload({ only: ['courts', 'waiting', 'refreshedAt'] });
        }, REFRESH_MS);

        return () => window.clearInterval(timer);
    }, []);

    const live = courts.filter((court) => court.match);
    const idle = courts.filter((court) => !court.match);

    /*
     * Live courts set the scale. One or two get the full treatment; beyond four
     * the panels tighten so every game still fits on one screen without the
     * board paging through them and hiding a game somebody is watching.
     */
    const dense = live.length > 4;
    const liveColumns =
        live.length <= 1 ? 'grid-cols-1' : live.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3';

    return (
        <main className="bg-surface-deep flex min-h-svh flex-col text-white">
            <Head title={`${branch.name} scoreboard | CourtPrime`} />

            <header className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-8 sm:py-5">
                <div className="min-w-0">
                    <p className="text-primary truncate text-[0.625rem] font-bold tracking-[0.2em] uppercase sm:text-xs">{display.brand}</p>
                    <h1 className="truncate text-[clamp(1.25rem,2.6vw,2.75rem)] leading-none font-black tracking-tight uppercase">{branch.name}</h1>
                </div>

                <div className="flex shrink-0 items-center gap-4 sm:gap-6">
                    <div className="text-right">
                        <p data-numeric className="text-[clamp(1rem,2vw,2rem)] leading-none font-black tabular-nums">
                            {clock}
                        </p>
                        <p className="text-[0.625rem] font-semibold tracking-widest text-white/40 uppercase sm:text-xs">
                            {live.length} live · {idle.length} open
                        </p>
                    </div>

                    {/* The mark steps aside on a phone: it was taking the room
                        the venue's own name needed, and truncating it. */}
                    {display.logo_url ? (
                        <img src={display.logo_url} alt={display.brand} className="hidden h-8 w-auto object-contain sm:block sm:h-12" />
                    ) : (
                        /* cp1: white "Court", legal on this navy and nowhere light. */
                        <BrandWordmark variant="onDark" height={40} className="hidden h-8 w-auto sm:block sm:h-10" />
                    )}
                </div>
            </header>

            <section className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 xl:p-8">
                {courts.length === 0 && <p className="text-body py-24 text-center text-white/40">No courts are set up at this venue yet.</p>}

                {courts.length > 0 && live.length === 0 && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
                        <p className="text-[clamp(1.5rem,4vw,3.5rem)] leading-none font-black tracking-tight uppercase">No games on right now</p>
                        <p className="text-[clamp(0.875rem,1.2vw,1.25rem)] text-white/45">
                            {idle.length} {idle.length === 1 ? 'court is' : 'courts are'} open at {branch.name}.
                        </p>
                    </div>
                )}

                {/* auto-rows-fr, so two panels on a 1080p wall fill the height
                    instead of clustering at the top over a dead half-screen. */}
                {live.length > 0 && (
                    <div className={cn('grid flex-1 auto-rows-fr gap-4 sm:gap-6', liveColumns)}>
                        {live.map((court) => (
                            <CourtPanel key={court.id} court={court} tick={tick} dense={dense} />
                        ))}
                    </div>
                )}

                {/* Idle courts stay on screen but never compete with a live game. */}
                {live.length > 0 && idle.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {idle.map((court) => (
                            <CourtPanel key={court.id} court={court} tick={tick} dense />
                        ))}
                    </div>
                )}
            </section>

            {(waiting.length > 0 || display.announcement) && (
                <footer className="border-t border-white/10 bg-black/20">
                    {waiting.length > 0 && (
                        <div className="flex items-center gap-4 overflow-hidden px-4 py-3 sm:gap-6 sm:px-8 sm:py-4">
                            <p className="shrink-0 text-[0.625rem] font-bold tracking-[0.2em] text-white/40 uppercase sm:text-xs">Up next</p>
                            <div className="flex min-w-0 flex-1 gap-4 overflow-x-auto sm:gap-6">
                                {waiting.map((player) => (
                                    <ScoreboardPortrait key={player.id} player={player} tick={tick} size="sm" />
                                ))}
                            </div>
                        </div>
                    )}

                    {display.announcement && (
                        <p className="bg-primary truncate px-4 py-2 text-[clamp(0.75rem,1.1vw,1.25rem)] font-bold sm:px-8 sm:py-2.5">
                            {display.announcement}
                        </p>
                    )}
                </footer>
            )}
        </main>
    );
}
