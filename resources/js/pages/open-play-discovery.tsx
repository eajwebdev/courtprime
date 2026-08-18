import { DateRail } from '@/components/booking/date-rail';
import { DiscoveryHero, FilterChip, FilterRow, Pagination } from '@/components/discovery/discovery-chrome';
import { DiscoveryPage } from '@/components/discovery/discovery-page';
import { EmptyState } from '@/components/empty-state';
import { OpenPlayGuestJoin } from '@/components/open-play-guest-join';
import { OpenPlayJoin } from '@/components/open-play-join';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { currency, time12h } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { MapPin, Search, Users, X } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- paginator payload is
   shaped by PublicOpenPlayController. */
type Session = {
    id: number;
    name: string;
    courts_count: number;
    session_date: string;
    start_time: string;
    end_time: string;
    max_players: number | null;
    players_count: number;
    queue_count: number;
    min_rating: number | null;
    max_rating: number | null;
    entry_fee: string | number | null;
    status: string;
    branch: { name: string; organization: string; organization_slug?: string | null };
};

type Props = { date: string; search: string; sessions: any };

function formatDay(iso: string) {
    if (!iso) return '';

    const value = new Date(`${iso}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diff = Math.round((value.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';

    return value.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function skillLabel(min: number | null, max: number | null) {
    if (min === null && max === null) return 'All levels';
    if (min !== null && max !== null) return `${Number(min).toFixed(1)}–${Number(max).toFixed(1)}`;
    if (min !== null) return `${Number(min).toFixed(1)}+`;
    return `Up to ${Number(max).toFixed(1)}`;
}

export default function OpenPlayDiscovery({ date, search, sessions }: Props) {
    const { auth } = usePage<SharedData>().props;
    const signedIn = Boolean(auth?.user);

    const [filters, setFilters] = useState({ date, search });
    const [freeOnly, setFreeOnly] = useState(false);
    const [spotsOnly, setSpotsOnly] = useState(false);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.get('/find-open-play', filters, { preserveState: true, preserveScroll: true });
    };

    const apply = (next: Partial<typeof filters>) => {
        const merged = { ...filters, ...next };
        setFilters(merged);
        router.get('/find-open-play', merged, { preserveState: true, preserveScroll: true });
    };

    /* Search as you type, as on every other network page. */
    useEffect(() => {
        if (filters.search === search) return;

        const timer = setTimeout(() => {
            router.get('/find-open-play', filters, { preserveState: true, preserveScroll: true, replace: true });
        }, 400);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.search, filters.date, search]);

    /* `sessions.data` is a fresh array each render, so the fallback has to live
       inside the memo or the dependency changes every time. */
    const visible = useMemo(() => {
        const rows: Session[] = sessions?.data ?? [];

        return rows.filter((session) => {
            if (freeOnly && Number(session.entry_fee ?? 0) > 0) return false;
            if (spotsOnly && session.max_players !== null && session.players_count >= session.max_players) return false;
            return true;
        });
    }, [sessions?.data, freeOnly, spotsOnly]);

    const openSpots = visible.reduce(
        (sum, session) => sum + (session.max_players === null ? 0 : Math.max(0, session.max_players - session.players_count)),
        0,
    );

    const clearFilters = () => {
        setFreeOnly(false);
        setSpotsOnly(false);
    };

    return (
        <>
            <Head title="Find open play | CourtPrime">
                <meta
                    name="description"
                    content="Drop-in pickleball sessions across every connected CourtPrime club. Join with the club's session code and the rotation assigns your court, partner and opponents."
                />
            </Head>

            <DiscoveryPage current="/find-open-play">
                <DiscoveryHero
                    eyebrow="CourtPrime open play network"
                    title="Turn up. Get matched. Play."
                    description="Drop-in sessions at every connected club."
                    artwork="/cp-model4.png"
                >
                    {/* Same field and rail as /find-courts and /me/book. */}
                    <form onSubmit={submit} className="relative mt-5 sm:mt-7 sm:max-w-xl">
                        <label htmlFor="q" className="sr-only">
                            Club, branch or session
                        </label>
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/70" aria-hidden />
                        <input
                            id="q"
                            type="search"
                            value={filters.search}
                            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                            placeholder="Club, branch or session"
                            /* 16px on phones: anything smaller makes iOS zoom. */
                            className="sm:text-label h-12 w-full rounded-xl border border-white/15 bg-white/8 pr-12 pl-10 text-base text-white backdrop-blur-md placeholder:text-white/45 [&::-webkit-search-cancel-button]:hidden"
                        />
                        {filters.search && (
                            <button
                                type="button"
                                onClick={() => apply({ search: '' })}
                                aria-label="Clear search"
                                className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-white/60 hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                        <button type="submit" className="sr-only">
                            Search
                        </button>
                    </form>

                    <DateRail value={filters.date} onChange={(next) => apply({ date: next })} tone="deep" className="mt-3" />

                    <FilterRow>
                        <FilterChip active={freeOnly} onClick={() => setFreeOnly((v) => !v)} icon={freeOnly ? X : undefined}>
                            Free entry
                        </FilterChip>
                        <FilterChip active={spotsOnly} onClick={() => setSpotsOnly((v) => !v)} icon={spotsOnly ? X : undefined}>
                            Spots available
                        </FilterChip>
                    </FilterRow>
                </DiscoveryHero>

                <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
                    {/*
                     * The code is the way in now, so it leads. A player handed one
                     * at the desk does not have to find their session in a list
                     * first — and a session that is not listed publicly can still
                     * be joined.
                     */}
                    {signedIn ? (
                        <OpenPlayJoin className="border-border bg-surface mb-8 rounded-xl border p-4 sm:p-5" />
                    ) : (
                        <div className="mb-8 space-y-2">
                            <OpenPlayGuestJoin className="border-border bg-surface rounded-xl border p-4 sm:p-5" />
                            <p className="text-meta text-muted">
                                Already have a CourtPrime account?{' '}
                                <Link href="/login" className="text-primary font-medium hover:underline">
                                    Sign in
                                </Link>{' '}
                                so this session counts towards your record.
                            </p>
                        </div>
                    )}

                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
                        <h2 className="text-h2 text-foreground">
                            <span data-numeric>{visible.length}</span> {visible.length === 1 ? 'session' : 'sessions'}
                        </h2>
                        {openSpots > 0 && (
                            <p className="text-meta text-muted">
                                <span data-numeric className="text-foreground font-semibold">
                                    {openSpots}
                                </span>{' '}
                                open spots
                            </p>
                        )}
                    </div>

                    {(freeOnly || spotsOnly) && (
                        <p className="text-meta text-muted mb-3">
                            Filters applied.{' '}
                            <button type="button" onClick={clearFilters} className="text-primary font-medium hover:underline">
                                Clear all
                            </button>
                        </p>
                    )}

                    {visible.length === 0 ? (
                        <EmptyState
                            title="No open play sessions match this search"
                            description="Try a later date, clear the filters, or browse connected courts instead."
                            artwork="/cp-paddle4.png"
                            action={
                                <div className="flex flex-wrap justify-center gap-2">
                                    <Button
                                        onClick={() => {
                                            clearFilters();
                                            apply({ search: '' });
                                        }}
                                    >
                                        Reset search
                                    </Button>
                                    <Button asChild variant="outline">
                                        <Link href="/find-courts">Find a court</Link>
                                    </Button>
                                </div>
                            }
                        />
                    ) : (
                        <div className="grid gap-3 lg:grid-cols-2">
                            {visible.map((session) => (
                                <SessionCard key={session.id} session={session} />
                            ))}
                        </div>
                    )}

                    <Pagination links={sessions?.links} meta={sessions?.meta ?? sessions} />
                </section>
            </DiscoveryPage>
        </>
    );
}

/**
 * One session.
 *
 * A card is right here — each session is individually actionable — but it was
 * three stacked bands, a progress bar, a queue line and two buttons. The facts
 * a player decides on are when, level, cost and whether there is room; the
 * action is the code.
 */
function SessionCard({ session }: { session: Session }) {
    const max = session.max_players;
    const filled = session.players_count;
    const spotsLeft = max === null ? null : Math.max(0, max - filled);
    const full = spotsLeft === 0;
    const fee = Number(session.entry_fee ?? 0);

    return (
        <article className="border-border bg-surface flex flex-col overflow-hidden rounded-xl border">
            <div className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                    <p className="text-meta text-primary truncate font-semibold tracking-wide uppercase">{session.branch.organization}</p>
                    <h3 className="text-h3 text-foreground mt-0.5 truncate">{session.name}</h3>
                    <p className="text-meta text-muted mt-0.5 flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{session.branch.name}</span>
                    </p>
                </div>
                <StatusBadge status={session.status} />
            </div>

            {/* One line for the four facts, instead of a three-column band. */}
            <p className="text-meta text-secondary border-border truncate border-t px-4 py-2.5">
                <span data-numeric className="text-foreground font-medium">
                    {formatDay(session.session_date)} {time12h(session.start_time)}–{time12h(session.end_time)}
                </span>
                <span className="text-muted"> · {skillLabel(session.min_rating, session.max_rating)}</span>
                <span className={cn(fee > 0 ? 'text-muted' : 'text-success font-medium')}> · {fee > 0 ? currency(fee) : 'Free'}</span>
                {session.courts_count > 0 && (
                    <span className="text-muted">
                        {' '}
                        · <span data-numeric>{session.courts_count}</span> {session.courts_count === 1 ? 'court' : 'courts'}
                    </span>
                )}
            </p>

            <div className="border-border mt-auto flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
                <p className="text-meta text-secondary flex items-center gap-1.5">
                    <Users className="size-3.5 shrink-0" aria-hidden />
                    <span data-numeric className="text-foreground font-semibold">
                        {filled}
                    </span>
                    {max !== null && (
                        <>
                            <span className="text-muted">/</span>
                            <span data-numeric>{max}</span>
                        </>
                    )}
                    <span className={cn(full ? 'text-danger font-medium' : 'text-muted')}>
                        {max === null ? 'joined' : full ? '· full' : `· ${spotsLeft} left`}
                    </span>
                </p>

                {/*
                 * No code and no one-tap join. Publishing the pair here would
                 * make it a credential anyone could read off a public page; the
                 * club hands them out, and both go into the form above.
                 */}
                <span className="text-meta text-muted">ID and key from the club</span>
            </div>
        </article>
    );
}
