import { DateRail } from '@/components/booking/date-rail';
import { DiscoveryHero, FilterChip, FilterRow } from '@/components/discovery/discovery-chrome';
import { DiscoveryPage } from '@/components/discovery/discovery-page';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { VenueGallery } from '@/components/venue/venue-gallery';
import { VenueLinks } from '@/components/venue/venue-links';
import { currency, friendlyDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Clock, Lock, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- branch payload is shaped
   by the existing Laravel controller. */
type Props = { date: string; search: string; branches: any[] };

export default function CourtDiscovery({ date, search, branches }: Props) {
    /* Anyone may browse availability; only a signed-in player may book. The
       rule is stated on the row rather than enforced by a silent bounce to a
       login form. Laravel keeps the intended URL, so signing in lands the
       visitor back on this exact court. */
    const { auth } = usePage<SharedData>().props;
    const signedIn = Boolean(auth?.user);
    const [filters, setFilters] = useState({ date, search });
    const [indoorOnly, setIndoorOnly] = useState(false);
    const [availableOnly, setAvailableOnly] = useState(false);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.get('/find-courts', filters, { preserveState: true, preserveScroll: true });
    };

    const apply = (next: Partial<typeof filters>) => {
        const merged = { ...filters, ...next };
        setFilters(merged);
        router.get('/find-courts', merged, { preserveState: true, preserveScroll: true });
    };

    /* Search runs as you type, as it does on /me/book. */
    useEffect(() => {
        if (filters.search === search) return;

        const timer = setTimeout(() => {
            router.get('/find-courts', filters, { preserveState: true, preserveScroll: true, replace: true });
        }, 400);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.search, filters.date, search]);

    /* Client-side refinements over the server result set. */
    const visible = useMemo(
        () =>
            branches
                .map((branch) => ({
                    ...branch,
                    courts: (branch.courts ?? []).filter((court: any) => {
                        if (indoorOnly && String(court.court_type).toLowerCase() !== 'indoor') return false;
                        if (availableOnly && Number(court.available_slots ?? 0) <= 0) return false;
                        return true;
                    }),
                }))
                .filter((branch) => branch.courts.length > 0),
        [branches, indoorOnly, availableOnly],
    );

    const totalCourts = visible.reduce((sum, branch) => sum + branch.courts.length, 0);
    const cheapest = visible
        .flatMap((b) => b.courts)
        .reduce((min: number | null, c: any) => {
            const rate = Number(c.standard_hourly_rate ?? 0);
            return min === null || (rate > 0 && rate < min) ? rate : min;
        }, null);

    return (
        <>
            <Head title="Find courts | CourtPrime">
                <meta
                    name="description"
                    content="Search connected CourtPrime clubs, compare available courts and rates, and book with one player identity."
                />
            </Head>

            <DiscoveryPage current="/find-courts">
                <DiscoveryHero
                    eyebrow="CourtPrime player network"
                    title="Find a court. Book with one account."
                    description="Search every connected club, compare open slots and rates, then check in with your CourtPrime identity."
                    artwork="/cp-model1.png"
                >
                    {/* Same field and same rail as /me/book, so a player moving
                        between discovery and booking never relearns the controls.
                        On navy the field takes the glass treatment rather than a
                        white block floating in the hero. */}
                    <form onSubmit={submit} className="relative mt-5 sm:mt-7 sm:max-w-xl">
                        <label htmlFor="q" className="sr-only">
                            Club, branch or city
                        </label>
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/70" aria-hidden />
                        <input
                            id="q"
                            type="search"
                            value={filters.search}
                            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                            placeholder="Club, branch or city"
                            /* 16px on phones: anything smaller makes iOS zoom the
                               page the moment the field is tapped. */
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
                        <FilterChip active={indoorOnly} onClick={() => setIndoorOnly((v) => !v)} icon={indoorOnly ? X : undefined}>
                            Indoor only
                        </FilterChip>
                        <FilterChip active={availableOnly} onClick={() => setAvailableOnly((v) => !v)} icon={availableOnly ? X : undefined}>
                            Has open slots
                        </FilterChip>
                    </FilterRow>
                </DiscoveryHero>

                {/* ---- Results ------------------------------------------------- */}
                <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                        {/* One line instead of a heading plus a subtitle: same
                            information, roughly half the vertical space. */}
                        <p className="text-label text-secondary min-w-0">
                            <span data-numeric className="text-foreground font-semibold">
                                {totalCourts}
                            </span>{' '}
                            {totalCourts === 1 ? 'court' : 'courts'} at{' '}
                            <span data-numeric className="text-foreground font-semibold">
                                {visible.length}
                            </span>{' '}
                            {visible.length === 1 ? 'club' : 'clubs'}
                            <span className="text-muted"> · {friendlyDate(filters.date)}</span>
                        </p>
                        {cheapest !== null && cheapest > 0 && (
                            <p className="text-label text-secondary">
                                From{' '}
                                <span data-numeric className="text-foreground font-semibold">
                                    {currency(cheapest)}
                                </span>{' '}
                                / hour
                            </p>
                        )}
                    </div>

                    {/* Said once, not stamped on all eighteen rows. Availability
                        itself stays public — that is the point of the page. */}
                    {!signedIn && (
                        <p className="border-border bg-surface text-meta text-secondary mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-3 py-2">
                            <Lock className="text-primary size-3.5 shrink-0" aria-hidden />
                            Availability is open to everyone. Sign in to confirm a booking.
                            <Link href="/login" className="text-primary font-medium hover:underline">
                                Sign in
                            </Link>
                        </p>
                    )}

                    {(indoorOnly || availableOnly) && (
                        <p className="text-meta text-muted mt-3 flex items-center gap-2">
                            <SlidersHorizontal className="size-3.5" />
                            Filters applied.
                            <button
                                type="button"
                                onClick={() => {
                                    setIndoorOnly(false);
                                    setAvailableOnly(false);
                                }}
                                className="text-primary font-medium hover:underline"
                            >
                                Clear all
                            </button>
                        </p>
                    )}

                    {visible.length === 0 ? (
                        <EmptyState
                            className="mt-8"
                            title="No connected courts match this search"
                            description="Try a different date, widen your search, or clear the filters."
                            artwork="/cp-paddle.png"
                            action={
                                <Button
                                    onClick={() => {
                                        setIndoorOnly(false);
                                        setAvailableOnly(false);
                                        apply({ search: '' });
                                    }}
                                >
                                    Reset search
                                </Button>
                            }
                        />
                    ) : (
                        <div className="mt-5 space-y-5">
                            {visible.map((branch) => (
                                /* Club header + divided court rows, the same shape
                                   /me/book uses. The 64px paddle tile, the "open"
                                   badge and a Book button on every single row were
                                   three pieces of chrome saying what the rows
                                   already say. */
                                <article key={branch.id} className="border-border bg-surface overflow-hidden rounded-xl border">
                                    {/* Gallery beside the details on desktop, stacked on a
                                        phone. A listing should show the place, not only
                                        name it. */}
                                    <div className="border-border grid gap-4 border-b p-4 sm:grid-cols-[minmax(0,18rem)_1fr]">
                                        <VenueGallery photos={branch.photos ?? []} name={branch.name} />

                                        <div className="flex min-w-0 flex-col">
                                            <div className="flex items-start gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-meta text-primary truncate font-semibold tracking-wide uppercase">
                                                        {branch.organization?.name}
                                                    </p>
                                                    <h3 className="text-h3 text-foreground mt-0.5 truncate">{branch.name}</h3>
                                                    <p className="text-meta text-muted mt-0.5 flex items-center gap-1.5">
                                                        <MapPin className="size-3.5 shrink-0" aria-hidden />
                                                        <span className="truncate">{branch.address ?? 'Address unavailable'}</span>
                                                    </p>
                                                </div>

                                                {branch.organization?.slug && (
                                                    <Button asChild variant="outline" size="sm" className="shrink-0">
                                                        <Link href={`/clubs/${branch.organization.slug}`}>Club</Link>
                                                    </Button>
                                                )}
                                            </div>

                                            {/* A divided facts band rather than a loose meta
                                                line, so the column has weight beside the
                                                gallery instead of a pool of dead space. */}
                                            <dl className="border-border bg-border mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-lg border">
                                                <div className="bg-surface px-3 py-2">
                                                    <dt className="text-muted text-[0.625rem] tracking-wide uppercase">Courts</dt>
                                                    <dd data-numeric className="text-label text-foreground font-semibold">
                                                        {branch.courts.length}
                                                    </dd>
                                                </div>
                                                <div className="bg-surface px-3 py-2">
                                                    <dt className="text-muted text-[0.625rem] tracking-wide uppercase">Open slots</dt>
                                                    <dd data-numeric className="text-label text-success font-semibold">
                                                        {branch.courts.reduce(
                                                            (sum: number, court: any) => sum + Number(court.available_slots ?? 0),
                                                            0,
                                                        )}
                                                    </dd>
                                                </div>
                                                <div className="bg-surface px-3 py-2">
                                                    <dt className="text-muted text-[0.625rem] tracking-wide uppercase">From</dt>
                                                    <dd data-numeric className="text-label text-foreground font-semibold">
                                                        {currency(
                                                            Math.min(...branch.courts.map((court: any) => Number(court.standard_hourly_rate ?? 0))),
                                                        )}
                                                    </dd>
                                                </div>
                                            </dl>

                                            {branch.operating_hours?.opens && (
                                                <p data-numeric className="text-meta text-muted mt-2 flex items-center gap-1.5">
                                                    <Clock className="size-3.5 shrink-0" aria-hidden />
                                                    Open {branch.operating_hours.opens} to {branch.operating_hours.closes}
                                                </p>
                                            )}

                                            <div className="mt-3">
                                                <VenueLinks links={branch.organization?.links} phone={branch.contact_number} name={branch.name} />
                                            </div>
                                        </div>
                                    </div>

                                    <ul className="bg-border grid gap-px sm:grid-cols-2">
                                        {branch.courts.map((court: any) => {
                                            const slots = Number(court.available_slots ?? 0);
                                            return (
                                                <li className="bg-surface" key={court.id}>
                                                    {/* The whole row books, so there is no
                                                        separate button to aim at. */}
                                                    <Link
                                                        href={`/me/book?court=${court.id}&search=${encodeURIComponent(branch.name ?? '')}&date=${encodeURIComponent(filters.date ?? '')}`}
                                                        aria-disabled={slots === 0}
                                                        className={cn(
                                                            'block px-4 py-3 transition-colors',
                                                            slots > 0 ? 'hover:bg-surface-muted' : 'pointer-events-none opacity-60',
                                                        )}
                                                    >
                                                        <div className="flex items-baseline justify-between gap-3">
                                                            <p className="text-label text-foreground min-w-0 truncate font-semibold">{court.name}</p>
                                                            <p data-numeric className="text-label text-foreground shrink-0 font-semibold">
                                                                {currency(court.standard_hourly_rate)}
                                                                <span className="text-meta text-muted ml-0.5 font-normal">/hr</span>
                                                            </p>
                                                        </div>

                                                        <div className="mt-1 flex items-baseline justify-between gap-3">
                                                            <p className="text-meta text-muted min-w-0 truncate capitalize">
                                                                {court.court_type} · {court.surface_type}
                                                            </p>
                                                            <p
                                                                className={cn(
                                                                    'text-meta shrink-0 font-medium',
                                                                    slots > 0 ? 'text-success' : 'text-muted',
                                                                )}
                                                            >
                                                                {slots > 0 ? (
                                                                    <>
                                                                        <span data-numeric>{slots}</span> slots
                                                                    </>
                                                                ) : (
                                                                    'Fully booked'
                                                                )}
                                                            </p>
                                                        </div>
                                                    </Link>
                                                </li>
                                            );
                                        })}

                                        {/* Fills the trailing cell of an odd row so the
                                            divider colour does not show as a grey slab. */}
                                        {branch.courts.length % 2 === 1 && <li className="bg-surface hidden sm:block" />}
                                    </ul>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </DiscoveryPage>
        </>
    );
}
