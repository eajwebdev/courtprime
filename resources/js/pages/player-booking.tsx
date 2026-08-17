import { BookingPanel, label12h, type BookableCourt } from '@/components/booking/booking-panel';
import { EmptyState } from '@/components/empty-state';
import { AthleteArtwork } from '@/components/marketing-artwork';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import AppLayout from '@/layouts/app-layout';
import { athleteFor } from '@/lib/athlete';
import { currency, friendlyDate, localIsoDate, shortDayLabel } from '@/lib/format';
import { revealProps } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, Check, MapPin, Search, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Home', href: '/me' },
    { title: 'Book a court', href: '/me/book' },
];

type Props = {
    profile: { courtprime_player_id: string; display_name: string; gender?: string | null; avatar_url?: string | null };
    date: string;
    search: string;
    selectedCourtId?: number | null;
    courts: BookableCourt[];
};

export default function PlayerBooking({ profile, date, search, selectedCourtId: preselected = null, courts }: Props) {
    const reduce = useReducedMotion();
    const [filters, setFilters] = useState({ date, search });
    /* Discovery deep-links to an exact court, so open on it rather than
       making the player find it again in the list. */
    const [selectedId, setSelectedId] = useState<number | null>(preselected);
    const [sheetOpen, setSheetOpen] = useState(false);

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

    /* Courts arrive flat; players think in clubs, so group them. */
    const groups = useMemo(() => {
        const map = new Map<string, { club: string; branch: string; address: string | null; courts: BookableCourt[] }>();

        for (const court of courts) {
            const key = `${court.branch.organization ?? 'Club'}-${court.branch.name ?? ''}`;
            if (!map.has(key)) {
                map.set(key, {
                    club: court.branch.organization ?? 'Connected club',
                    branch: court.branch.name ?? '',
                    address: court.branch.address,
                    courts: [],
                });
            }
            map.get(key)!.courts.push(court);
        }

        return [...map.values()];
    }, [courts]);

    const selected = courts.find((court) => court.id === selectedId) ?? null;
    const totalOpen = courts.reduce((sum, court) => sum + court.slots.filter((slot) => slot.available).length, 0);

    const choose = (court: BookableCourt) => {
        setSelectedId(court.id);
        setSheetOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} width="wide">
            <Head title="Book a court | CourtPrime" />

            <div>
                {/* Identity band */}
                <div className="bg-surface-deep text-surface-deep-foreground relative overflow-hidden rounded-xl px-5 py-6 sm:px-7 sm:py-7">
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
                        className="pointer-events-none absolute -right-3 bottom-0 h-[112%] w-auto max-w-[34%] object-contain object-bottom opacity-60 sm:-right-6 sm:max-w-[30%]"
                    />
                    <div
                        aria-hidden
                        className="from-surface-deep via-surface-deep/92 pointer-events-none absolute inset-0 bg-gradient-to-r to-transparent"
                    />

                    {/* Same identity band as /me so the two screens read as one app. */}
                    <div className="relative flex max-w-[72%] items-center gap-3 sm:max-w-none sm:gap-3.5">
                        <div className="border-primary/40 size-12 shrink-0 overflow-hidden rounded-full border-2 bg-white/10 sm:size-14">
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
                            <p data-numeric className="text-eyebrow text-primary uppercase">
                                {profile.courtprime_player_id}
                            </p>
                            <h1 className="mt-0.5 text-[1.25rem] leading-tight font-semibold tracking-tight text-white sm:text-[1.75rem]">
                                Book a court
                            </h1>
                            <p className="text-meta mt-0.5 text-white/55">
                                <span data-numeric>{totalOpen}</span> slots open · {friendlyDate(filters.date)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search + date */}
                {/* One divided band rather than nested cards inside a card, so it
                    matches the metric and activity bands on /me. */}
                <form
                    onSubmit={submit}
                    className="border-border bg-border mt-5 grid gap-px overflow-hidden rounded-xl border sm:grid-cols-[1fr_13rem_auto]"
                >
                    <div className="bg-surface flex flex-1 items-center gap-3 px-4 py-2.5">
                        <Search className="text-primary size-4 shrink-0" aria-hidden />
                        <div className="min-w-0 flex-1">
                            <label htmlFor="q" className="text-muted block text-[0.6875rem] tracking-wider uppercase">
                                Club, branch or court
                            </label>
                            <Input
                                id="q"
                                value={filters.search}
                                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                                placeholder="Search connected clubs"
                                className="text-label h-7 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                            />
                        </div>
                        {filters.search && (
                            <button
                                type="button"
                                onClick={() => go({ search: '' })}
                                aria-label="Clear search"
                                className="text-muted hover:text-foreground rounded-full p-1"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>

                    <div className="bg-surface flex items-center gap-3 px-4 py-2.5">
                        <CalendarDays className="text-primary size-4 shrink-0" aria-hidden />
                        <div className="min-w-0 flex-1">
                            <label htmlFor="d" className="text-muted block text-[0.6875rem] tracking-wider uppercase">
                                Date
                            </label>
                            <Input
                                id="d"
                                type="date"
                                value={filters.date}
                                onChange={(event) => go({ date: event.target.value })}
                                className="text-label h-7 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                            />
                        </div>
                    </div>

                    <Button type="submit" size="touch" className="rounded-none sm:px-7">
                        Search
                    </Button>
                </form>

                {/* Quick dates, faster than opening a picker on a phone. */}
                <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                    {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                        const value = localIsoDate(offset);
                        const active = filters.date === value;
                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={() => go({ date: value })}
                                aria-pressed={active}
                                className={cn(
                                    'text-meta min-h-9 shrink-0 rounded-full border px-3.5 font-medium transition-colors',
                                    active
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-surface text-secondary hover:text-foreground',
                                )}
                            >
                                {shortDayLabel(offset)}
                            </button>
                        );
                    })}
                </div>

                {/* Courts + booking panel */}
                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_24rem]">
                    <div className="min-w-0">
                        {courts.length === 0 ? (
                            <EmptyState
                                title="No connected courts for this search"
                                description="Try a different club, or pick another date."
                                artwork="/cp-paddle.png"
                                action={<Button onClick={() => go({ search: '' })}>Reset search</Button>}
                            />
                        ) : (
                            <div className="space-y-6">
                                {groups.map((group) => (
                                    <section key={`${group.club}-${group.branch}`}>
                                        <div className="mb-3">
                                            <h2 className="text-h3 text-foreground">{group.branch}</h2>
                                            <p className="text-meta text-muted flex items-center gap-1.5">
                                                <MapPin className="size-3.5 shrink-0" aria-hidden />
                                                <span className="truncate">
                                                    {group.club}
                                                    {group.address ? ` · ${group.address}` : ''}
                                                </span>
                                            </p>
                                        </div>

                                        {/* Divided rows, not floating cards: one bordered
                                            group per club reads calmer than N boxes. */}
                                        <div className="border-border bg-border grid gap-px overflow-hidden rounded-xl border sm:grid-cols-2">
                                            {group.courts.map((court, index) => {
                                                const open = court.slots.filter((slot) => slot.available);
                                                const rate = Number(
                                                    court.has_membership_rate && court.member_hourly_rate
                                                        ? court.member_hourly_rate
                                                        : court.standard_hourly_rate,
                                                );
                                                const isSelected = court.id === selectedId;

                                                return (
                                                    <motion.button
                                                        key={court.id}
                                                        type="button"
                                                        {...revealProps(reduce, { delay: Math.min(index, 5) * 0.04, y: 12 })}
                                                        onClick={() => choose(court)}
                                                        disabled={open.length === 0}
                                                        aria-pressed={isSelected}
                                                        className={cn(
                                                            'relative p-4 text-left transition-colors',
                                                            isSelected && 'bg-primary-soft',
                                                            !isSelected && open.length > 0 && 'bg-surface hover:bg-surface-muted',
                                                            open.length === 0 && 'bg-surface cursor-not-allowed opacity-60',
                                                        )}
                                                    >
                                                        {isSelected && <span aria-hidden className="bg-primary absolute inset-y-0 left-0 w-1" />}
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <p className="text-label text-foreground truncate font-semibold">{court.name}</p>
                                                                <p className="text-meta text-muted truncate capitalize">
                                                                    {court.court_type} · {court.surface_type}
                                                                </p>
                                                            </div>
                                                            {isSelected && (
                                                                <span className="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded-full">
                                                                    <Check className="size-3" />
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="mt-3 flex items-end justify-between gap-3">
                                                            <div>
                                                                <p data-numeric className="text-h3 text-foreground">
                                                                    {currency(rate)}
                                                                    <span className="text-meta text-muted ml-1 font-normal">/ hr</span>
                                                                </p>
                                                                {court.has_membership_rate && (
                                                                    <p className="text-meta text-success font-semibold">Member rate</p>
                                                                )}
                                                            </div>
                                                            <p
                                                                className={cn(
                                                                    'text-meta font-medium',
                                                                    open.length > 0 ? 'text-success' : 'text-muted',
                                                                )}
                                                            >
                                                                {open.length > 0 ? `${open.length} slots` : 'Fully booked'}
                                                            </p>
                                                        </div>

                                                        {open.length > 0 && (
                                                            <p className="text-meta text-muted mt-2 truncate">Next {label12h(open[0].start_time)}</p>
                                                        )}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Desktop: sticky rail. Mobile: the same panel inside a sheet. */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-24">
                            {selected ? (
                                <div className="border-border bg-surface overflow-hidden rounded-xl border">
                                    <BookingPanel court={selected} date={filters.date} />
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

            {/* Mobile booking sheet, rising from the bottom where the thumb is. */}
            <Sheet open={sheetOpen && Boolean(selected)} onOpenChange={setSheetOpen}>
                <SheetContent side="bottom" className="bg-surface h-[88svh] rounded-t-2xl p-0 lg:hidden">
                    <SheetTitle className="sr-only">Booking details</SheetTitle>
                    {selected && <BookingPanel court={selected} date={filters.date} onClose={() => setSheetOpen(false)} />}
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
