import { BrandWordmark } from '@/components/marketing-artwork';
import { PlayerBottomNav } from '@/components/player-bottom-nav';
import { CourtPanel, type ScoreboardCourt } from '@/components/scoreboard/court-panel';
import { usePortraitTick } from '@/components/scoreboard/player-portrait';
import { shellForWorkspace } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type DisplaySettings = {
    brand: string;
    logo_url: string | null;
    primary_color: string;
    announcement: string;
    rotation_seconds: number | string;
    portrait_seconds: number;
};

type Props = { courts: ScoreboardCourt[]; displaySettings: DisplaySettings };

/**
 * How often the board pulls fresh scores.
 *
 * Short, because it is a scoreboard and a point that lands should show up while
 * the people who saw it are still looking. It costs one small JSON response —
 * the courts and nothing else — rather than the whole page.
 */
const REFRESH_MS = 3000;

/**
 * Keep the board current without re-rendering the page.
 *
 * `router.reload` re-renders from new props: every portrait remounts and
 * restarts its cycle, and the scores blink, so a wall display flickered every
 * time it refreshed. This fetches the courts and folds them into state
 * instead, which React reconciles in place — the numbers change and nothing
 * else moves.
 *
 * It heals by itself. A screen that has been on for three days has to survive
 * the venue's wifi dropping without anybody noticing it did, so a failed poll
 * is simply skipped and the next one tries again; the board goes on showing
 * the last scores it knows rather than emptying itself.
 */
function useLiveCourts(initial: ScoreboardCourt[], search: string): ScoreboardCourt[] {
    const [courts, setCourts] = useState(initial);

    /* Server-rendered props win when the page itself navigates. */
    useEffect(() => setCourts(initial), [initial]);

    useEffect(() => {
        let cancelled = false;
        /* The branch and the display token travel with the page, so the feed
           is asked the same question the page was. */
        const url = `/display/live/feed${search}`;

        const poll = async () => {
            try {
                const response = await fetch(url, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                });

                if (!response.ok) return;

                const payload = await response.json();

                if (!cancelled && Array.isArray(payload?.courts)) {
                    setCourts(payload.courts);
                }
            } catch {
                /* Offline, asleep, or the venue's router rebooted. Hold what is
                   on screen and try again on the next tick. */
            }
        };

        const timer = window.setInterval(poll, REFRESH_MS);
        /* A tab that was in the background comes back current immediately
           rather than showing a stale score until the next interval. */
        const onVisible = () => document.visibilityState === 'visible' && poll();
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            cancelled = true;
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [search]);

    return courts;
}

/**
 * How many courts fit a page at each width.
 *
 * Live courts are the subject, and a live panel carries portraits, so fewer fit
 * than the old name-and-number card did. `null` means "do not paginate": below
 * 640px a single-court page left most of the screen empty and turned ten courts
 * into ten rotations, so phones scroll the full list instead. Rotation stays a
 * kiosk behaviour.
 */
const PAGE_SIZES = [
    { query: '(min-width: 1536px)', size: 6 },
    { query: '(min-width: 1024px)', size: 4 },
    { query: '(min-width: 640px)', size: 2 },
];

function usePageSize(): number | null {
    const [size, setSize] = useState<number | null>(6);

    useEffect(() => {
        const lists = PAGE_SIZES.map((entry) => ({ ...entry, list: window.matchMedia(entry.query) }));

        const resolve = () => setSize(lists.find((entry) => entry.list.matches)?.size ?? null);

        resolve();
        lists.forEach((entry) => entry.list.addEventListener('change', resolve));
        return () => lists.forEach((entry) => entry.list.removeEventListener('change', resolve));
    }, []);

    return size;
}

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
 * The club's wall board.
 *
 * This route is two things at once: a screen bolted to a TV in the club, and
 * the player app's Live tab. Anonymous kiosks keep the bare full-bleed screen; a
 * signed-in player keeps their shell, because landing on a page with no header
 * and no tab bar is a dead end they cannot navigate out of. `?tv=1` forces the
 * bare board for a venue that signed in on the TV.
 *
 * Live courts are drawn as the branch scoreboard draws them — the players' own
 * portraits, or the CourtPrime stand-ins for whoever has uploaded none — so the
 * two screens a club runs are the same screen at two scopes rather than two
 * designs. Idle courts recede: somebody glancing up from across the room needs
 * to find the game, not read an inventory of the building.
 */
export default function DisplayLive({ courts: initialCourts, displaySettings }: Props) {
    const { auth, workspace } = usePage<SharedData>().props;
    const { url } = usePage();
    const kiosk = url.includes('tv=1');
    const chrome = Boolean(auth?.user) && shellForWorkspace(workspace) === 'player' && !kiosk;

    const clock = useClock();
    const tick = usePortraitTick(displaySettings.portrait_seconds);

    /* Whatever the page arrived with, kept current in place. */
    const search = url.includes('?') ? `?${url.split('?')[1]}` : '';
    const courts = useLiveCourts(initialCourts, search);

    const live = useMemo(() => courts.filter((court) => court.match), [courts]);
    const idle = useMemo(() => courts.filter((court) => !court.match), [courts]);

    /*
     * Only live courts page. The old board rotated through every court it had,
     * so a club with two games on twelve courts spent most of the cycle showing
     * empty ones — and a game could be off screen while somebody was watching
     * it. Idle courts sit under the games instead, all of them, all the time.
     */
    const rotationSeconds = Math.max(Number(displaySettings.rotation_seconds ?? 12), 5);
    const pageSize = usePageSize();
    const livePages = useMemo(() => (pageSize === null ? [live] : chunk(live, pageSize)), [live, pageSize]);
    const [page, setPage] = useState(0);
    const [paused, setPaused] = useState(false);

    /* A narrower viewport makes more pages, so an old index can fall out of range. */
    useEffect(() => {
        setPage((current) => (current >= livePages.length ? 0 : current));
    }, [livePages.length]);

    useEffect(() => {
        if (livePages.length <= 1 || paused) return;

        const timer = window.setInterval(() => {
            setPage((current) => (current + 1) % livePages.length);
        }, rotationSeconds * 1000);

        return () => window.clearInterval(timer);
    }, [livePages.length, rotationSeconds, paused]);

    const visibleLive = livePages[page] ?? livePages[0] ?? [];
    const accent = displaySettings.primary_color || 'var(--primary)';

    /*
     * Live courts set the scale. One or two get the full treatment; beyond four
     * the panels tighten so every game still fits without the board hiding one.
     */
    const dense = visibleLive.length > 4;
    const liveColumns =
        visibleLive.length <= 1
            ? 'grid-cols-1'
            : visibleLive.length === 2
              ? 'grid-cols-1 lg:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3';

    return (
        <main className={cn('bg-surface-deep flex min-h-svh flex-col text-white', chrome && 'pb-24 md:pb-0')}>
            <Head title="Live courts | CourtPrime" />

            {/* Player chrome: a way back, and the tab bar they arrived from. */}
            {chrome && (
                <div className="z-nav bg-surface-deep/95 sticky top-0 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 backdrop-blur-md">
                    <Link href="/me" aria-label="CourtPrime player home">
                        <BrandWordmark variant="onDark" height={28} className="h-7" />
                    </Link>
                    <Link
                        href="/display/live?tv=1"
                        className="text-meta flex min-h-9 items-center rounded-full border border-white/15 px-3.5 font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        Full screen
                    </Link>
                </div>
            )}

            {/* ---- Header ---------------------------------------------------- */}
            <header className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-8 sm:py-5">
                <div className="min-w-0">
                    <p className="truncate text-[0.625rem] font-bold tracking-[0.2em] uppercase sm:text-xs" style={{ color: accent }}>
                        {displaySettings.brand}
                    </p>
                    <h1 className="text-[clamp(1.25rem,2.6vw,2.75rem)] leading-none font-black tracking-tight uppercase">Live Courts</h1>
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
                        the club's own name needed, and truncating it. */}
                    {displaySettings.logo_url ? (
                        <img
                            src={displaySettings.logo_url}
                            alt={displaySettings.brand}
                            className="hidden h-8 w-auto object-contain sm:block sm:h-12"
                        />
                    ) : (
                        /* cp1: white "Court", legal on this navy and nowhere light. */
                        <BrandWordmark variant="onDark" height={40} className="hidden h-8 w-auto sm:block sm:h-10" />
                    )}
                </div>
            </header>

            {/* ---- Courts ----------------------------------------------------- */}
            <section
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onFocusCapture={() => setPaused(true)}
                onBlurCapture={() => setPaused(false)}
                className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 xl:p-8"
            >
                {courts.length === 0 && <p className="text-body py-24 text-center text-white/40">No courts are configured for this display.</p>}

                {courts.length > 0 && live.length === 0 && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
                        <p className="text-[clamp(1.5rem,4vw,3.5rem)] leading-none font-black tracking-tight uppercase">No games on right now</p>
                        <p className="text-[clamp(0.875rem,1.2vw,1.25rem)] text-white/45">
                            {idle.length} {idle.length === 1 ? 'court is' : 'courts are'} open.
                        </p>
                    </div>
                )}

                {/* auto-rows-fr, so two panels on a 1080p wall fill the height
                    instead of clustering at the top over a dead half-screen. */}
                {visibleLive.length > 0 && (
                    <div className={cn('grid flex-1 auto-rows-fr gap-4 sm:gap-6', liveColumns)}>
                        {visibleLive.map((court) => (
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

            {/* ---- Ticker ----------------------------------------------------- */}
            <footer
                className="sticky bottom-0 flex items-center justify-between gap-4 px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8"
                style={{ backgroundColor: accent }}
            >
                <p className="truncate text-sm font-bold sm:text-lg xl:text-2xl">{displaySettings.announcement}</p>

                {livePages.length > 1 && (
                    <div className="flex shrink-0 items-center gap-2">
                        {/* Dots double as the page indicator and a manual control. */}
                        <div className="hidden items-center gap-1.5 sm:flex">
                            {livePages.map((_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setPage(index)}
                                    aria-label={`Show live court page ${index + 1}`}
                                    aria-current={index === page}
                                    className={cn('size-2.5 rounded-full transition-colors', index === page ? 'bg-white' : 'bg-white/40')}
                                />
                            ))}
                        </div>
                        <span data-numeric className="text-meta font-semibold whitespace-nowrap sm:text-sm">
                            {page + 1} / {livePages.length}
                        </span>
                    </div>
                )}
            </footer>

            {chrome && <PlayerBottomNav />}
        </main>
    );
}

function chunk<T>(items: T[], size: number): T[][] {
    const pages: T[][] = [];

    for (let index = 0; index < items.length; index += Math.max(size, 1)) {
        pages.push(items.slice(index, index + Math.max(size, 1)));
    }

    return pages;
}
