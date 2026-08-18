import { BookingPanel, label12h, type BookableCourt } from '@/components/booking/booking-panel';
import { CourtGrid, type GridSelection } from '@/components/booking/court-grid';
import { DateRail } from '@/components/booking/date-rail';
import { EmptyState } from '@/components/empty-state';
import { AthleteArtwork } from '@/components/marketing-artwork';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import AppLayout from '@/layouts/app-layout';
import { athleteFor } from '@/lib/athlete';
import { currency, friendlyDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { LayoutGrid, List, MapPin, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Home', href: '/me' },
    { title: 'Book a court', href: '/me/book' },
];

/* The query a player actually arrives with is "Saturday evening", not "court 3". */
const PERIODS = [
    { key: 'any', label: 'Any', phrase: 'today', from: 0, to: 24 },
    { key: 'morning', label: 'Morning', phrase: 'in the morning', from: 0, to: 12 },
    { key: 'afternoon', label: 'Afternoon', phrase: 'in the afternoon', from: 12, to: 17 },
    { key: 'evening', label: 'Evening', phrase: 'in the evening', from: 17, to: 24 },
] as const;

type PeriodKey = (typeof PERIODS)[number]['key'];

type Props = {
    profile: { courtprime_player_id: string; display_name: string; gender?: string | null; avatar_url?: string | null };
    date: string;
    search: string;
    selectedCourtId?: number | null;
    courts: BookableCourt[];
};

export default function PlayerBooking({ profile, date, search, selectedCourtId: preselected = null, courts }: Props) {
    const [filters, setFilters] = useState({ date, search });
    /* Discovery deep-links to an exact court. That used to jump straight into
       the panel, which skipped the grid entirely — the player landed on a list
       of time chips having never seen the day. Now the link lands on the grid
       with that court's venue chosen and its column marked, and the player
       picks the time there like everywhere else. */
    const [selectedId, setSelectedId] = useState<number | null>(null);
    /* A ?court= deep link from Discover should land in the booking panel, not
       on a list the player has to search again. */
    const [sheetOpen, setSheetOpen] = useState(false);
    /* Time groups that the player has asked to see in full. */
    const [expanded, setExpanded] = useState<string[]>([]);
    /* A full day is 30-odd start times, which is a 16,000px page. Show a
       screenful and let the player ask for the rest. */
    const [visibleTimes, setVisibleTimes] = useState(8);
    const [view, setView] = useState<'grid' | 'list'>('grid');
    /*
     * The sheet is only ever the mobile presentation — desktop uses the sticky
     * rail. Its content carried `lg:hidden` but the overlay did not, so opening
     * a court on a wide screen dimmed the whole page behind an invisible sheet.
     * Gate the sheet itself rather than hiding half of it.
     */
    const [desktop, setDesktop] = useState(false);
    /* Which club's grid is on screen. A grid of every court in the network
       would be eighteen columns wide. */
    const [branchKey, setBranchKey] = useState<string | null>(null);
    const [periodKey, setPeriodKey] = useState<PeriodKey>('any');
    /* Tapping a time in the list, or dragging a block in the grid, opens the
       panel already on that slot and length. */
    const [pendingStart, setPendingStart] = useState<string | null>(null);
    const [pendingMinutes, setPendingMinutes] = useState<number | null>(null);

    const go = (next: Partial<typeof filters>) => {
        const merged = { ...filters, ...next };
        setFilters(merged);
        setSelectedId(null);
        router.get('/me/book', merged, { preserveState: true, preserveScroll: true });
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        go({});
    };

    /*
     * Search runs as you type. A phone has no room for a submit button beside
     * the field without it colliding with the selected date chip, and a button
     * the player has to find and press is the slowest way to filter a list.
     */
    useEffect(() => {
        if (filters.search === search) return;

        const timer = setTimeout(() => {
            setSelectedId(null);
            router.get('/me/book', filters, { preserveState: true, preserveScroll: true, replace: true });
        }, 400);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.search, filters.date, search]);

    const period = PERIODS.find((entry) => entry.key === periodKey) ?? PERIODS[0];

    /*
     * Time first, not club first.
     *
     * Discover already answers "where can I play" as a directory of clubs and
     * their courts. Repeating that here made the two tabs the same screen. The
     * question this tab exists to answer is "what can I play at 7pm", so the
     * inventory is pivoted: one section per start time, every court in the
     * network that is free then, cheapest first.
     */
    const timeGroups = useMemo(() => {
        const map = new Map<string, { court: BookableCourt; rate: number }[]>();

        for (const court of courts) {
            const rate = Number(court.has_membership_rate && court.member_hourly_rate ? court.member_hourly_rate : court.standard_hourly_rate);

            for (const slot of court.slots) {
                if (!slot.available) continue;

                const hour = Number(slot.start_time.slice(0, 2));
                if (hour < period.from || hour >= period.to) continue;

                const entries = map.get(slot.start_time) ?? [];
                entries.push({ court, rate });
                map.set(slot.start_time, entries);
            }
        }

        return [...map.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([start, entries]) => ({ start, entries: entries.sort((a, b) => a.rate - b.rate) }));
    }, [courts, period]);

    const selected = courts.find((court) => court.id === selectedId) ?? null;
    const totalOpen = timeGroups.reduce((sum, group) => sum + group.entries.length, 0);

    /* Courts grouped by venue, for the grid's column set. */
    const branches = useMemo(() => {
        const map = new Map<string, { key: string; name: string; club: string; courts: BookableCourt[] }>();

        for (const court of courts) {
            const key = `${court.branch.organization ?? 'Club'}-${court.branch.name ?? ''}`;
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    name: court.branch.name ?? 'Venue',
                    club: court.branch.organization ?? 'Connected club',
                    courts: [],
                });
            }
            map.get(key)!.courts.push(court);
        }

        return [...map.values()];
    }, [courts]);

    /* A ?court= link opens on that court's venue rather than the first one. */
    const linkedBranchKey = useMemo(() => {
        const court = courts.find((entry) => entry.id === preselected);
        return court ? `${court.branch.organization ?? 'Club'}-${court.branch.name ?? ''}` : null;
    }, [courts, preselected]);

    const branch =
        branches.find((entry) => entry.key === branchKey) ?? branches.find((entry) => entry.key === linkedBranchKey) ?? branches[0] ?? null;

    /* One row per start time the venue actually opens, inside the chosen time of
       day. Courts share the same generated day grid, but a union keeps this
       correct if one of them ever does not. */
    const gridTimes = useMemo(() => {
        if (!branch) return [];

        const all = new Set<string>();
        for (const court of branch.courts) {
            for (const slot of court.slots) {
                const hour = Number(slot.start_time.slice(0, 2));
                if (hour >= period.from && hour < period.to) all.add(slot.start_time);
            }
        }

        return [...all].sort((a, b) => a.localeCompare(b));
    }, [branch, period]);

    const pickFromGrid = ({ court, start, minutes }: GridSelection) => {
        setSelectedId(court.id);
        setPendingStart(start);
        setPendingMinutes(minutes);
        setSheetOpen(true);
    };

    /* A new date, search or time-of-day starts the list from the top again. */
    useEffect(() => {
        const query = window.matchMedia('(min-width: 1024px)');
        const sync = () => setDesktop(query.matches);

        sync();
        query.addEventListener('change', sync);
        return () => query.removeEventListener('change', sync);
    }, []);

    useEffect(() => {
        setVisibleTimes(8);
        setExpanded([]);
        setBranchKey(null);
    }, [courts, periodKey]);

    const toggle = (start: string) =>
        setExpanded((current) => (current.includes(start) ? current.filter((item) => item !== start) : [...current, start]));

    const choose = (court: BookableCourt, start?: string) => {
        setSelectedId(court.id);
        setPendingStart(start ?? null);
        setPendingMinutes(null);
        setSheetOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} width="wide">
            <Head title="Book a court | CourtPrime" />

            <div>
                {/* Identity band, same shape and radius as the one on /me so the
                    two screens read as one app. */}
                <div className="bg-surface-deep text-surface-deep-foreground relative overflow-hidden rounded-2xl px-4 py-5 sm:px-7 sm:py-7">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                'radial-gradient(24rem 18rem at 88% 20%, color-mix(in srgb, var(--primary) 22%, transparent) 0%, transparent 62%)',
                        }}
                    />
                    <AthleteArtwork
                        asset={athleteFor(profile.gender)}
                        decorative
                        sizes="(max-width: 640px) 34vw, 200px"
                        className="pointer-events-none absolute -right-3 bottom-0 h-full w-auto max-w-[34%] object-contain object-bottom opacity-60 sm:-right-6 sm:max-w-[30%]"
                    />
                    <div
                        aria-hidden
                        className="from-surface-deep via-surface-deep/92 pointer-events-none absolute inset-0 bg-gradient-to-r to-transparent"
                    />

                    <div className="relative flex max-w-[70%] items-center gap-3 sm:max-w-none sm:gap-3.5">
                        <div className="border-primary/40 size-11 shrink-0 overflow-hidden rounded-full border-2 bg-white/10 sm:size-14">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="size-full object-cover" />
                            ) : (
                                <span className="flex size-full items-center justify-center text-base font-semibold text-white">
                                    {String(profile.display_name ?? '')
                                        .split(' ')
                                        .filter(Boolean)
                                        .slice(0, 2)
                                        .map((part: string) => part[0]?.toUpperCase() ?? '')
                                        .join('')}
                                </span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p data-numeric className="text-eyebrow text-primary truncate uppercase">
                                {profile.courtprime_player_id}
                            </p>
                            <h1 className="mt-0.5 text-[1.25rem] leading-tight font-semibold tracking-tight text-white sm:text-[1.75rem]">
                                Book a court
                            </h1>
                            <p className="text-meta mt-0.5 truncate text-white/55">
                                <span data-numeric>{totalOpen}</span> slots open · {friendlyDate(filters.date)}
                            </p>
                        </div>
                    </div>
                </div>

                {/*
                 * A search field is a field, not a stacked label block. The input
                 * itself is the 48px control, so the app's global focus outline
                 * traces the box being typed in rather than drawing a second box
                 * inside it. Icon and label are the affordance; a uppercase
                 * micro-label above a magnifier says nothing the icon has not.
                 */}
                <form onSubmit={submit} className="mt-4 sm:mt-5">
                    <div className="relative">
                        <label htmlFor="q" className="sr-only">
                            Search clubs, branches or courts
                        </label>
                        <Search className="text-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden />
                        <input
                            id="q"
                            type="search"
                            value={filters.search}
                            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                            placeholder="Search clubs, branches or courts"
                            /* 16px on phones: anything smaller makes iOS zoom the
                               whole page the moment the field is tapped. */
                            className="border-border bg-surface text-foreground placeholder:text-muted sm:text-label h-12 w-full rounded-xl border pr-12 pl-10 text-base [&::-webkit-search-cancel-button]:hidden"
                        />
                        {filters.search && (
                            <button
                                type="button"
                                onClick={() => go({ search: '' })}
                                aria-label="Clear search"
                                className="text-muted hover:text-foreground absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center rounded-full"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>

                    {/* Enter still submits immediately; the debounce covers the
                        far more common case of tapping away from the field. */}
                    <button type="submit" className="sr-only">
                        Search
                    </button>
                </form>

                <DateRail value={filters.date} onChange={(next) => go({ date: next })} className="mt-3" />

                {/* A segmented control, not a scrolling chip row: four fixed
                    options fit the width, so nothing should need scrolling to
                    discover. */}
                <div role="group" aria-label="Time of day" className="bg-surface-muted mt-2.5 grid grid-cols-4 gap-1 rounded-xl p-1">
                    {PERIODS.map((entry) => {
                        const active = periodKey === entry.key;
                        return (
                            <button
                                key={entry.key}
                                type="button"
                                onClick={() => setPeriodKey(entry.key)}
                                aria-pressed={active}
                                className={cn(
                                    'text-meta min-h-9 truncate rounded-lg px-1 font-medium transition-colors',
                                    active ? 'border-border bg-surface text-foreground border' : 'text-muted hover:text-foreground',
                                )}
                            >
                                {entry.label}
                            </button>
                        );
                    })}
                </div>

                {/*
                 * Venue chips and the view switch share a row. The switch used to
                 * sit beside the time-of-day control and squeezed it until
                 * "Afternoon" rendered as "After…".
                 */}
                <div className="mt-2.5 flex items-center gap-2">
                    {view === 'grid' && branches.length > 1 ? (
                        <div className="no-scrollbar -ml-4 flex min-w-0 flex-1 gap-2 overflow-x-auto pl-4 sm:ml-0 sm:pl-0">
                            {branches.map((entry) => {
                                const active = entry.key === branch?.key;
                                return (
                                    <button
                                        key={entry.key}
                                        type="button"
                                        onClick={() => setBranchKey(entry.key)}
                                        aria-pressed={active}
                                        className={cn(
                                            'text-meta flex min-h-9 shrink-0 items-center rounded-full border px-3.5 font-medium transition-colors',
                                            active
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-border bg-surface text-secondary hover:text-foreground',
                                        )}
                                    >
                                        {entry.name}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <span className="flex-1" />
                    )}

                    {/* Grid is the default: it is the only view that shows a whole
                        venue's day at once and lets a block be dragged out. The
                        list stays for scanning by time. */}
                    <div role="group" aria-label="View" className="bg-surface-muted flex shrink-0 gap-1 rounded-xl p-1">
                        {(
                            [
                                { key: 'grid', label: 'Grid', icon: LayoutGrid },
                                { key: 'list', label: 'List', icon: List },
                            ] as const
                        ).map((entry) => {
                            const active = view === entry.key;
                            return (
                                <button
                                    key={entry.key}
                                    type="button"
                                    onClick={() => setView(entry.key)}
                                    aria-pressed={active}
                                    aria-label={`${entry.label} view`}
                                    className={cn(
                                        'flex size-9 items-center justify-center rounded-lg transition-colors',
                                        active ? 'border-border bg-surface text-foreground border' : 'text-muted hover:text-foreground',
                                    )}
                                >
                                    <entry.icon className="size-4" aria-hidden />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Courts + booking panel */}
                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_24rem]">
                    <div className="min-w-0">
                        {view === 'grid' && branch ? (
                            <div>
                                <div className="mb-2.5">
                                    <h2 className="text-h3 text-foreground truncate">{branch.name}</h2>
                                    <p className="text-meta text-muted flex items-center gap-1.5">
                                        <MapPin className="size-3.5 shrink-0" aria-hidden />
                                        <span className="truncate">{branch.club}</span>
                                    </p>
                                </div>

                                {gridTimes.length === 0 ? (
                                    <p className="border-border text-label text-muted rounded-xl border border-dashed px-5 py-10 text-center">
                                        Nothing open {period.phrase} at this venue.
                                    </p>
                                ) : (
                                    <CourtGrid
                                        courts={branch.courts}
                                        times={gridTimes}
                                        highlightCourtId={preselected}
                                        selection={
                                            selected && pendingStart
                                                ? { courtId: selected.id, start: pendingStart, minutes: pendingMinutes ?? 30 }
                                                : null
                                        }
                                        onSelect={pickFromGrid}
                                    />
                                )}
                            </div>
                        ) : timeGroups.length === 0 ? (
                            <EmptyState
                                title={period.key === 'any' ? 'Nothing open on this date' : `Nothing open ${period.phrase}`}
                                description="Try another time of day, a different club, or pick another date."
                                artwork="/cp-paddle.png"
                                action={
                                    period.key === 'any' ? (
                                        <Button onClick={() => go({ search: '' })}>Reset search</Button>
                                    ) : (
                                        <Button onClick={() => setPeriodKey('any')}>Show any time</Button>
                                    )
                                }
                            />
                        ) : (
                            <div className="space-y-5">
                                {timeGroups.slice(0, visibleTimes).map((group) => {
                                    /* Three is enough to choose from; the rest are one
                                       tap away rather than 18 rows of scroll per hour. */
                                    const open = expanded.includes(group.start);
                                    const shown = open ? group.entries : group.entries.slice(0, 3);

                                    return (
                                        <section key={group.start}>
                                            <div className="mb-2 flex items-baseline justify-between gap-3">
                                                <h2 data-numeric className="text-h3 text-foreground">
                                                    {label12h(group.start)}
                                                </h2>
                                                <p className="text-meta text-muted">
                                                    <span data-numeric>{group.entries.length}</span> {group.entries.length === 1 ? 'court' : 'courts'}
                                                </p>
                                            </div>

                                            <div className="border-border bg-border grid gap-px overflow-hidden rounded-xl border sm:grid-cols-2">
                                                {shown.map(({ court, rate }) => {
                                                    const isSelected = court.id === selectedId;

                                                    return (
                                                        <button
                                                            key={court.id}
                                                            type="button"
                                                            onClick={() => choose(court, group.start)}
                                                            aria-pressed={isSelected}
                                                            className={cn(
                                                                'relative px-4 py-3 text-left transition-colors',
                                                                isSelected ? 'bg-primary-soft' : 'bg-surface hover:bg-surface-muted',
                                                            )}
                                                        >
                                                            {isSelected && <span aria-hidden className="bg-primary absolute inset-y-0 left-0 w-1" />}

                                                            <div className="flex items-baseline justify-between gap-3">
                                                                <p className="text-label text-foreground min-w-0 truncate font-semibold">
                                                                    {court.branch.name}
                                                                </p>
                                                                <p data-numeric className="text-label text-foreground shrink-0 font-semibold">
                                                                    {currency(rate)}
                                                                    <span className="text-meta text-muted ml-0.5 font-normal">/hr</span>
                                                                </p>
                                                            </div>

                                                            <p className="text-meta text-muted mt-1 truncate capitalize">
                                                                {court.name} · {court.court_type}
                                                                {court.has_membership_rate && (
                                                                    <span className="text-success font-medium"> · Member rate</span>
                                                                )}
                                                            </p>
                                                        </button>
                                                    );
                                                })}

                                                {/* Fills the trailing cell of an odd row so the
                                                    divider colour does not show as a grey slab. */}
                                                {shown.length % 2 === 1 && <div className="bg-surface hidden sm:block" />}
                                            </div>

                                            {group.entries.length > 3 && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggle(group.start)}
                                                    className="text-meta text-primary mt-2 min-h-9 font-medium hover:underline"
                                                >
                                                    {open ? 'Show fewer' : `Show all ${group.entries.length} courts`}
                                                </button>
                                            )}
                                        </section>
                                    );
                                })}

                                {timeGroups.length > visibleTimes && (
                                    <Button variant="outline" size="touch" className="w-full" onClick={() => setVisibleTimes((count) => count + 8)}>
                                        Show later times
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Desktop: sticky rail. Mobile: the same panel inside a sheet. */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-24">
                            {selected ? (
                                <div className="border-border bg-surface overflow-hidden rounded-xl border">
                                    <BookingPanel court={selected} date={filters.date} initialStart={pendingStart} initialMinutes={pendingMinutes} />
                                </div>
                            ) : (
                                <div className="border-border text-label text-muted rounded-xl border border-dashed px-5 py-10 text-center">
                                    Pick a court to start your booking.
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>

            {/* Mobile booking sheet, rising from the bottom where the thumb is.
                The primitive close is hidden because the panel header already
                carries a full-size Close target, and the two sat on top of each
                other in the same corner. */}
            <Sheet open={!desktop && sheetOpen && Boolean(selected)} onOpenChange={setSheetOpen}>
                <SheetContent hideClose side="bottom" className="bg-surface h-[88svh] rounded-t-2xl p-0 lg:hidden">
                    <SheetTitle className="sr-only">Booking details</SheetTitle>
                    {selected && (
                        <BookingPanel
                            court={selected}
                            date={filters.date}
                            initialStart={pendingStart}
                            initialMinutes={pendingMinutes}
                            onClose={() => setSheetOpen(false)}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
