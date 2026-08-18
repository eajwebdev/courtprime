import { BrandWordmark } from '@/components/marketing-artwork';
import { PlayerBottomNav } from '@/components/player-bottom-nav';
import { LiveBadge, StatusBadge } from '@/components/status-badge';
import { shellForWorkspace } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payload from LiveCourtController. */
type DisplaySettings = {
    brand: string;
    logo_url: string | null;
    primary_color: string;
    announcement: string;
    rotation_seconds: number | string;
};

type Props = { courts: any[]; displaySettings: DisplaySettings };

/**
 * How many courts fit a page at each width.
 *
 * `null` means "do not paginate": below 640px a single-court page left most of
 * the screen empty and turned ten courts into ten rotations, so phones scroll
 * the full list instead. Rotation stays a kiosk behaviour.
 */
const PAGE_SIZES = [
    { query: '(min-width: 1280px)', size: 8 },
    { query: '(min-width: 768px)', size: 4 },
    { query: '(min-width: 640px)', size: 2 },
];

function usePageSize(): number | null {
    const [size, setSize] = useState<number | null>(8);

    useEffect(() => {
        const lists = PAGE_SIZES.map((entry) => ({ ...entry, list: window.matchMedia(entry.query) }));

        const resolve = () => setSize(lists.find((entry) => entry.list.matches)?.size ?? null);

        resolve();
        lists.forEach((entry) => entry.list.addEventListener('change', resolve));
        return () => lists.forEach((entry) => entry.list.removeEventListener('change', resolve));
    }, []);

    return size;
}

export default function DisplayLive({ courts, displaySettings }: Props) {
    /*
     * This route is two things at once: a wall board bolted to a TV in the club,
     * and the player app's Live tab. Anonymous kiosks keep the bare full-bleed
     * screen; a signed-in player keeps their shell, because landing on a page
     * with no header and no tab bar is a dead end they cannot navigate out of.
     * `?tv=1` forces the bare board for a venue that signed in on the TV.
     */
    const { auth, workspace } = usePage<SharedData>().props;
    const { url } = usePage();
    const kiosk = url.includes('tv=1');
    const chrome = Boolean(auth?.user) && shellForWorkspace(workspace) === 'player' && !kiosk;

    const rotationSeconds = Math.max(Number(displaySettings.rotation_seconds ?? 12), 5);
    const pageSize = usePageSize();
    const courtPages = useMemo(() => (pageSize === null ? [courts] : chunk(courts, pageSize)), [courts, pageSize]);
    const [page, setPage] = useState(0);
    const [paused, setPaused] = useState(false);

    /* A narrower viewport makes more pages, so an old index can fall out of range. */
    useEffect(() => {
        setPage((current) => (current >= courtPages.length ? 0 : current));
    }, [courtPages.length]);

    useEffect(() => {
        if (courtPages.length <= 1 || paused) return;

        const timer = window.setInterval(() => {
            setPage((current) => (current + 1) % courtPages.length);
        }, rotationSeconds * 1000);

        return () => window.clearInterval(timer);
    }, [courtPages.length, rotationSeconds, paused]);

    /* This is a live scoreboard, so it refetches court data rather than showing
       whatever was true when the kiosk was last opened. */
    useEffect(() => {
        const timer = window.setInterval(() => {
            router.reload({ only: ['courts'] });
        }, 15000);

        return () => window.clearInterval(timer);
    }, []);

    const visibleCourts = courtPages[page] ?? courtPages[0] ?? [];
    const accent = displaySettings.primary_color || 'var(--primary)';

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
            <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
                <div className="min-w-0">
                    <p className="truncate text-[0.6875rem] font-semibold tracking-wider uppercase sm:text-sm" style={{ color: accent }}>
                        {displaySettings.brand}
                    </p>
                    <h1 className="text-[1.5rem] leading-none font-black tracking-tight sm:text-[2.25rem] lg:text-[3rem] xl:text-[3.5rem]">
                        LIVE COURTS
                    </h1>
                </div>

                <img
                    src={displaySettings.logo_url || '/cp.png'}
                    alt={displaySettings.brand}
                    className="h-10 w-auto shrink-0 rounded-md bg-white/10 object-contain p-1.5 sm:h-14 sm:p-2 lg:h-16"
                />
            </header>

            {/* ---- Courts ----------------------------------------------------- */}
            <section
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onFocusCapture={() => setPaused(true)}
                onBlurCapture={() => setPaused(false)}
                className="grid content-start gap-3 p-4 sm:flex-1 sm:grid-cols-2 sm:gap-4 sm:p-6 lg:p-8 xl:grid-cols-4"
            >
                {visibleCourts.length === 0 && (
                    <p className="text-body col-span-full py-16 text-center text-white/50">No courts are configured for this display.</p>
                )}

                {visibleCourts.map((court: any) => {
                    const match = court.matches?.[0];
                    const status = String(court.status ?? 'available');

                    return (
                        <article
                            key={court.id}
                            className={cn(
                                'flex flex-col rounded-xl border p-4 sm:p-5',
                                'sm:min-h-[15rem] xl:min-h-[18rem]',
                                match ? 'border-white/20 bg-white/[0.07]' : 'border-white/10 bg-white/[0.03]',
                            )}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="truncate text-lg font-black uppercase sm:text-2xl xl:text-3xl">{court.name}</h2>
                                {match ? <LiveBadge /> : <StatusBadge status={status} />}
                            </div>

                            {match ? (
                                /* Scores sit side by side so the card stays legible when it
                                   is short on a phone and huge on a wall display. */
                                <div className="mt-auto grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-4 sm:gap-3">
                                    <p className="truncate text-center text-xs font-bold sm:text-base xl:text-lg">{match.team_one_name}</p>
                                    <span aria-hidden />
                                    <p className="truncate text-center text-xs font-bold sm:text-base xl:text-lg">{match.team_two_name}</p>

                                    <p
                                        data-numeric
                                        aria-live="polite"
                                        className="text-center text-[clamp(2.25rem,9vw,5.5rem)] leading-none font-black"
                                        style={{ color: accent }}
                                    >
                                        {match.team_one_score}
                                    </p>
                                    <span className="text-meta px-1 text-white/35">VS</span>
                                    <p
                                        data-numeric
                                        aria-live="polite"
                                        className="text-center text-[clamp(2.25rem,9vw,5.5rem)] leading-none font-black"
                                    >
                                        {match.team_two_score}
                                    </p>

                                    <Link
                                        href={`/live/matches/${match.id}`}
                                        className="text-meta col-span-3 mt-3 inline-flex min-h-11 items-center justify-center rounded-md border border-white/15 px-3 font-semibold text-white/80 transition-colors hover:bg-white/10"
                                    >
                                        Open player view
                                    </Link>
                                </div>
                            ) : (
                                <div className="mt-auto pt-6 text-center">
                                    <p className="text-xl font-black uppercase sm:text-3xl xl:text-4xl">{status.replaceAll('_', ' ')}</p>
                                    <p className="text-meta mt-2 text-white/45 sm:text-sm">Next booking will appear here</p>
                                </div>
                            )}
                        </article>
                    );
                })}
            </section>

            {/* ---- Ticker ----------------------------------------------------- */}
            <footer
                className="sticky bottom-0 flex items-center justify-between gap-4 px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8"
                style={{ backgroundColor: accent }}
            >
                <p className="truncate text-sm font-bold sm:text-lg xl:text-2xl">{displaySettings.announcement}</p>

                {courtPages.length > 1 && (
                    <div className="flex shrink-0 items-center gap-2">
                        {/* Dots double as the page indicator and a manual control. */}
                        <div className="hidden items-center gap-1.5 sm:flex">
                            {courtPages.map((_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setPage(index)}
                                    aria-label={`Show court page ${index + 1}`}
                                    aria-current={index === page}
                                    className={cn('size-2.5 rounded-full transition-colors', index === page ? 'bg-white' : 'bg-white/40')}
                                />
                            ))}
                        </div>
                        <span data-numeric className="text-meta font-semibold whitespace-nowrap sm:text-sm">
                            {page + 1} / {courtPages.length}
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
