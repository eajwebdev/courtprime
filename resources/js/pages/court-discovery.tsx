import { DiscoveryHero, DiscoverySearchBar, FilterChip, FilterRow, SearchField } from '@/components/discovery/discovery-chrome';
import { DiscoveryPage } from '@/components/discovery/discovery-page';
import { EmptyState } from '@/components/empty-state';
import { EquipmentArtwork } from '@/components/marketing-artwork';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { currency, friendlyDate, localIsoDate } from '@/lib/format';
import { revealProps } from '@/lib/motion';
import { Head, Link, router } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, Clock, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- branch payload is shaped
   by the existing Laravel controller. */
type Props = { date: string; search: string; branches: any[] };

const quickRanges = [
    { label: 'Today', offset: 0 },
    { label: 'Tomorrow', offset: 1 },
    { label: 'This weekend', offset: null },
];

function nextSaturday() {
    const today = new Date();
    return localIsoDate((6 - today.getDay() + 7) % 7 || 7);
}

export default function CourtDiscovery({ date, search, branches }: Props) {
    const reduce = useReducedMotion();
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
                    <DiscoverySearchBar onSubmit={submit}>
                        <SearchField
                            icon={Search}
                            label="Club, branch or city"
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
                                placeholder="e.g. Bacolod, Prime Pickle Center"
                                aria-label="Club, branch or city"
                                className="text-label h-7 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                            />
                        </SearchField>

                        <SearchField icon={CalendarDays} label="Date" className="sm:w-56">
                            <Input
                                type="date"
                                value={filters.date}
                                onChange={(event) => setFilters({ ...filters, date: event.target.value })}
                                aria-label="Date"
                                className="text-label h-7 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                            />
                        </SearchField>

                        <Button type="submit" size="touch" className="sm:w-auto sm:px-8">
                            <Search className="size-4" /> Search
                        </Button>
                    </DiscoverySearchBar>

                    <FilterRow>
                        {quickRanges.map((range) => {
                            const value = range.offset === null ? nextSaturday() : localIsoDate(range.offset);
                            return (
                                <FilterChip key={range.label} active={filters.date === value} onClick={() => apply({ date: value })} icon={Clock}>
                                    {range.label}
                                </FilterChip>
                            );
                        })}

                        <span aria-hidden className="mx-1 h-4 w-px bg-white/15" />

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
                        <div className="mt-6 space-y-5">
                            {visible.map((branch, index) => (
                                <motion.article
                                    key={branch.id}
                                    {...revealProps(reduce, { delay: Math.min(index, 6) * 0.05, y: 16 })}
                                    className="border-border bg-surface hover:shadow-e1 overflow-hidden rounded-xl border transition-shadow"
                                >
                                    <div className="border-border flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center">
                                        <div className="bg-surface-deep flex size-16 shrink-0 items-center justify-center rounded-lg">
                                            <EquipmentArtwork
                                                asset="/cp-paddle4.png"
                                                decorative
                                                width={96}
                                                height={96}
                                                sizes="64px"
                                                className="size-11"
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-meta text-primary truncate font-semibold tracking-wide uppercase">
                                                {branch.organization?.name}
                                            </p>
                                            <h3 className="text-h2 text-foreground mt-0.5 truncate">{branch.name}</h3>
                                            <p className="text-label text-secondary mt-1 flex items-center gap-1.5">
                                                <MapPin className="size-3.5 shrink-0" aria-hidden />
                                                <span className="truncate">{branch.address ?? 'Address unavailable'}</span>
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                                            <StatusBadge status="active" label="open" />
                                            {branch.organization?.slug && (
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/clubs/${branch.organization.slug}`}>View club</Link>
                                                </Button>
                                            )}
                                            <Button asChild size="sm">
                                                <Link
                                                    href={`/me/book?search=${encodeURIComponent(branch.name ?? '')}&date=${encodeURIComponent(filters.date ?? '')}`}
                                                >
                                                    Book here
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>

                                    <ul className="bg-border grid gap-px sm:grid-cols-2 lg:grid-cols-3">
                                        {branch.courts.map((court: any) => {
                                            const slots = Number(court.available_slots ?? 0);
                                            return (
                                                <li className="bg-surface flex flex-col gap-3 p-4" key={court.id}>
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-label text-foreground truncate font-semibold">{court.name}</p>
                                                            <p className="text-meta text-muted truncate capitalize">
                                                                {court.court_type} · {court.surface_type}
                                                            </p>
                                                        </div>
                                                        <StatusBadge
                                                            status={slots > 0 ? 'available' : 'reserved'}
                                                            label={slots > 0 ? `${slots} slots` : 'full'}
                                                        />
                                                    </div>

                                                    <div className="mt-auto flex items-end justify-between gap-3">
                                                        <p data-numeric className="text-h3 text-foreground">
                                                            {currency(court.standard_hourly_rate)}
                                                            <span className="text-meta text-muted ml-1 font-normal">/ hr</span>
                                                        </p>
                                                        {/* `disabled` on an asChild Button lands on the anchor, where it
                                                            does nothing, so a full court renders as real inert text
                                                            rather than a link that still navigates. */}
                                                        {slots > 0 ? (
                                                            <Button asChild size="sm">
                                                                <Link
                                                                    href={`/me/book?court=${court.id}&search=${encodeURIComponent(branch.name ?? '')}&date=${encodeURIComponent(filters.date ?? '')}`}
                                                                >
                                                                    Book
                                                                </Link>
                                                            </Button>
                                                        ) : (
                                                            <span className="text-meta text-muted border-border inline-flex h-9 items-center rounded-md border px-3">
                                                                Fully booked
                                                            </span>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </motion.article>
                            ))}
                        </div>
                    )}
                </section>
            </DiscoveryPage>
        </>
    );
}
