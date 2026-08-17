import { DiscoveryHero, DiscoverySearchBar, FilterChip, FilterRow, Pagination, SearchField } from '@/components/discovery/discovery-chrome';
import { DiscoveryPage } from '@/components/discovery/discovery-page';
import { EmptyState } from '@/components/empty-state';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { currency, localIsoDate } from '@/lib/format';
import { revealProps } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, Clock, MapPin, Search, Ticket, Users, X } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- paginator payload is
   shaped by PublicOpenPlayController. */
type Session = {
    id: number;
    name: string;
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

function nextSaturday() {
    const today = new Date();
    return localIsoDate((6 - today.getDay() + 7) % 7 || 7);
}

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
    if (min === null && max === null) return 'All skill levels';
    if (min !== null && max !== null) return `${Number(min).toFixed(1)} - ${Number(max).toFixed(1)} rating`;
    if (min !== null) return `${Number(min).toFixed(1)}+ rating`;
    return `Up to ${Number(max).toFixed(1)} rating`;
}

export default function OpenPlayDiscovery({ date, search, sessions }: Props) {
    const reduce = useReducedMotion();
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
                    content="Join open play sessions across connected CourtPrime clubs. Compare skill bands, entry fees and available spots."
                />
            </Head>

            <DiscoveryPage current="/find-open-play">
                <DiscoveryHero
                    eyebrow="CourtPrime open play network"
                    title="Turn up. Get matched. Play."
                    description="Public sessions across every connected club, with skill bands, entry fees and live spot counts, so you know what you're walking into."
                    artwork="/cp-model1.png"
                >
                    <DiscoverySearchBar onSubmit={submit}>
                        <SearchField
                            icon={Search}
                            label="Club, branch or session"
                            className="flex-1"
                            trailing={
                                filters.search ? (
                                    <button
                                        type="button"
                                        onClick={() => apply({ search: '' })}
                                        aria-label="Clear search"
                                        className="text-muted hover:text-foreground rounded-full p-1"
                                    >
                                        <X className="size-4" />
                                    </button>
                                ) : undefined
                            }
                        >
                            <Input
                                value={filters.search}
                                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                                placeholder="e.g. Bacolod, evening social"
                                aria-label="Club, branch or session"
                                className="text-label h-7 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                            />
                        </SearchField>

                        <SearchField icon={CalendarDays} label="Starting from" className="sm:w-56">
                            <Input
                                type="date"
                                value={filters.date}
                                onChange={(event) => setFilters({ ...filters, date: event.target.value })}
                                aria-label="Starting from"
                                className="text-label h-7 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                            />
                        </SearchField>

                        <Button type="submit" size="touch" className="sm:w-auto sm:px-8">
                            <Search className="size-4" /> Search
                        </Button>
                    </DiscoverySearchBar>

                    <FilterRow>
                        {/* The controller filters `session_date >= date`, so each chip is a
                            distinct starting point, no two resolve to the same value. */}
                        {[
                            ['Today', localIsoDate(0)],
                            ['Tomorrow', localIsoDate(1)],
                            ['This weekend', nextSaturday()],
                        ].map(([label, value]) => (
                            <FilterChip key={label} active={filters.date === value} onClick={() => apply({ date: value })} icon={Clock}>
                                {label}
                            </FilterChip>
                        ))}

                        <span aria-hidden className="mx-1 h-4 w-px bg-white/15" />

                        <FilterChip active={freeOnly} onClick={() => setFreeOnly((v) => !v)} icon={freeOnly ? X : undefined}>
                            Free entry
                        </FilterChip>
                        <FilterChip active={spotsOnly} onClick={() => setSpotsOnly((v) => !v)} icon={spotsOnly ? X : undefined}>
                            Spots available
                        </FilterChip>
                    </FilterRow>
                </DiscoveryHero>

                {/* ---- Results --------------------------------------------------- */}
                <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <h2 className="text-h2 text-foreground">
                            <span data-numeric>{visible.length}</span> {visible.length === 1 ? 'session' : 'sessions'}
                        </h2>
                        {openSpots > 0 && (
                            <p className="text-label text-secondary">
                                <span data-numeric className="text-foreground font-semibold">
                                    {openSpots}
                                </span>{' '}
                                open spots right now
                            </p>
                        )}
                    </div>

                    {(freeOnly || spotsOnly) && (
                        <p className="text-meta text-muted mt-3">
                            Filters applied.{' '}
                            <button type="button" onClick={clearFilters} className="text-primary font-medium hover:underline">
                                Clear all
                            </button>
                        </p>
                    )}

                    {visible.length === 0 ? (
                        <EmptyState
                            className="mt-8"
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
                        <div className="mt-6 grid gap-4 lg:grid-cols-2">
                            {visible.map((session, index) => (
                                <SessionCard key={session.id} session={session} reduce={reduce} index={index} />
                            ))}
                        </div>
                    )}

                    <Pagination links={sessions?.links} meta={sessions?.meta ?? sessions} />
                </section>
            </DiscoveryPage>
        </>
    );
}

function SessionCard({ session, reduce, index }: { session: Session; reduce: boolean | null; index: number }) {
    const max = session.max_players;
    const filled = session.players_count;
    const spotsLeft = max === null ? null : Math.max(0, max - filled);
    const pct = max && max > 0 ? Math.min(100, Math.round((filled / max) * 100)) : 0;
    const full = spotsLeft === 0;
    const fee = Number(session.entry_fee ?? 0);

    return (
        <motion.article
            {...revealProps(reduce, { delay: Math.min(index, 6) * 0.05, y: 16 })}
            className="border-border bg-surface hover:shadow-e1 flex flex-col overflow-hidden rounded-xl border transition-shadow"
        >
            <div className="flex items-start justify-between gap-3 p-5 pb-4">
                <div className="min-w-0">
                    <p className="text-meta text-primary truncate font-semibold tracking-wide uppercase">{session.branch.organization}</p>
                    <h3 className="text-h3 text-foreground mt-0.5 truncate">{session.name}</h3>
                    <p className="text-meta text-muted mt-1 flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{session.branch.name}</span>
                    </p>
                </div>
                <StatusBadge status={session.status} />
            </div>

            {/* When + skill + fee, the three things a player decides on. */}
            {/* Three ~110px columns are too tight under 400px, so When takes the
                full first row on phones. */}
            <dl className="border-border bg-border grid grid-cols-2 gap-px border-y sm:grid-cols-3">
                <div className="bg-surface col-span-2 px-4 py-3 sm:col-span-1">
                    <dt className="text-muted text-[0.6875rem] tracking-wider uppercase">When</dt>
                    <dd className="text-label text-foreground mt-0.5 font-medium">{formatDay(session.session_date)}</dd>
                    <dd data-numeric className="text-meta text-secondary">
                        {session.start_time} to {session.end_time}
                    </dd>
                </div>
                <div className="bg-surface px-4 py-3">
                    <dt className="text-muted text-[0.6875rem] tracking-wider uppercase">Skill</dt>
                    <dd className="text-label text-foreground mt-0.5 font-medium">{skillLabel(session.min_rating, session.max_rating)}</dd>
                </div>
                <div className="bg-surface px-4 py-3">
                    <dt className="text-muted text-[0.6875rem] tracking-wider uppercase">Entry</dt>
                    <dd data-numeric className={cn('text-label mt-0.5 font-semibold', fee > 0 ? 'text-foreground' : 'text-success')}>
                        {fee > 0 ? currency(fee) : 'Free'}
                    </dd>
                </div>
            </dl>

            {/* Capacity is the headline number for open play. */}
            <div className="mt-auto p-5 pt-4">
                <div className="flex items-baseline justify-between gap-3">
                    <p className="text-label text-secondary flex items-center gap-1.5">
                        <Users className="size-4 shrink-0" aria-hidden />
                        <span data-numeric className="text-foreground font-semibold">
                            {filled}
                        </span>
                        {max !== null && (
                            <>
                                <span className="text-muted">/</span>
                                <span data-numeric>{max}</span>
                            </>
                        )}
                        <span className="text-muted">players</span>
                    </p>
                    <p className={cn('text-meta font-medium', full ? 'text-danger' : spotsLeft !== null ? 'text-success' : 'text-muted')}>
                        {max === null ? 'No cap' : full ? 'Session full' : `${spotsLeft} spots left`}
                    </p>
                </div>

                {max !== null && (
                    <div
                        className="bg-surface-muted mt-2 h-2 overflow-hidden rounded-full"
                        role="progressbar"
                        aria-valuenow={filled}
                        aria-valuemin={0}
                        aria-valuemax={max}
                        aria-label="Players joined"
                    >
                        <div
                            className={cn('h-full rounded-full transition-[width] duration-300', full ? 'bg-danger' : 'bg-primary')}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                )}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    {session.queue_count > 0 ? (
                        <p className="text-meta text-muted flex items-center gap-1.5">
                            <Ticket className="size-3.5 shrink-0" aria-hidden />
                            <span data-numeric>{session.queue_count}</span> waiting in queue
                        </p>
                    ) : (
                        <span />
                    )}

                    <div className="flex gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
                        {session.branch.organization_slug && (
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/clubs/${session.branch.organization_slug}`}>View club</Link>
                            </Button>
                        )}
                        <Button asChild size="sm" variant={full ? 'outline' : 'default'}>
                            <Link href="/login">{full ? 'Join queue' : 'Join session'}</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </motion.article>
    );
}
