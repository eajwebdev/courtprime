import { BookingFormDialog, type BookingCourt, type BookingSeed } from '@/components/booking/booking-form-dialog';
import { DateRail } from '@/components/booking/date-rail';
import { SchedulerBoard, type SchedulerBlock, type SchedulerCourt, type SchedulerReservation } from '@/components/scheduler/scheduler-board';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import AppLayout from '@/layouts/app-layout';
import { currency, time12h } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Check, LogIn, Phone, Play, Plus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Scheduler', href: '/scheduler' }];

type Props = {
    date: string;
    branchId: number | null;
    opensAt: number;
    closesAt: number;
    branches: { id: number; name: string; code: string }[];
    courts: (SchedulerCourt & { standard_hourly_rate?: string | number | null })[];
    reservations: SchedulerReservation[];
    blocks: SchedulerBlock[];
};

/**
 * The day, on one board.
 *
 * This page used to be a read-only grid that said "booking placement is created
 * from the Reservations screen" — so seeing a free court and filling it took a
 * different page, a different form, and remembering which court and hour you
 * were looking at. Every cell is now the action for that cell: a free hour opens
 * the booking form already carrying the court, date and time; a booked one opens
 * the booking, with the step it is waiting for.
 */
export default function Scheduler({ date, branchId, opensAt, closesAt, branches, courts, reservations, blocks }: Props) {
    const [seed, setSeed] = useState<BookingSeed>({});
    const [booking, setBooking] = useState(false);
    const [open, setOpen] = useState<SchedulerReservation | null>(null);

    const hours = useMemo(() => Array.from({ length: closesAt - opensAt }, (_, index) => opensAt + index), [opensAt, closesAt]);

    const go = (next: { date?: string; branch_id?: number | null }) =>
        router.get(
            '/scheduler',
            {
                date: next.date ?? date,
                branch_id: next.branch_id === undefined ? (branchId ?? undefined) : (next.branch_id ?? undefined),
            },
            { preserveState: true, preserveScroll: true },
        );

    /* Sold hours over sellable hours, which is the number an owner actually
       runs the day on. */
    const stats = useMemo(() => {
        const sellable = courts.length * hours.length;
        const sold = reservations.reduce(
            (total, entry) => total + Math.max(1, Number(entry.end_time.slice(0, 2)) - Number(entry.start_time.slice(0, 2))),
            0,
        );

        return {
            sold,
            sellable,
            occupancy: sellable > 0 ? Math.round((sold / sellable) * 100) : 0,
            revenue: reservations.reduce((total, entry) => total + Number(entry.amount_due ?? 0), 0),
            unpaid: reservations.filter((entry) => entry.payment_status !== 'paid').length,
        };
    }, [courts.length, hours.length, reservations]);

    const bookingCourts: BookingCourt[] = courts.map((court) => ({
        id: court.id,
        name: court.name,
        branch: { name: court.branch.name ?? undefined, code: court.branch.code ?? undefined },
        standard_hourly_rate: court.standard_hourly_rate,
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Scheduler" />

            {/* The board owns the leftover height, so the day is scrolled inside
                its own frame with the date rail and the totals always in view —
                rather than scrolling the whole page away to reach the evening. */}
            {/* overflow-x-hidden: the board, the date rail and the venue chips
                each scroll inside themselves, so nothing on this page should ever
                scroll the page sideways. Without it the widest of them sets a
                floor the shell cannot shrink under on a phone. */}
            <div className="flex h-[calc(100svh-4rem)] min-w-0 flex-col gap-4 overflow-x-hidden p-4 md:p-6">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-h1 text-foreground">Scheduler</h1>
                        <p className="text-meta mt-1">Tap a free hour to book it. Tap a booking to move it along.</p>
                    </div>

                    <Button
                        onClick={() => {
                            setSeed({ reservation_date: date });
                            setBooking(true);
                        }}
                    >
                        <Plus className="size-4" />
                        New booking
                    </Button>
                </header>

                {/* Wrapped: the rail is eight fixed 64px cells, and as a direct
                    flex item its min-content width set a floor the page could not
                    shrink under. A block wrapper with min-w-0 absorbs that and
                    lets the rail scroll itself, as it is built to. */}
                <div className="min-w-0">
                    <DateRail value={date} onChange={(next) => go({ date: next })} />
                </div>

                {branches.length > 1 && (
                    <div className="no-scrollbar -mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
                        <BranchChip active={branchId === null} onClick={() => go({ branch_id: null })}>
                            All venues
                        </BranchChip>
                        {branches.map((branch) => (
                            <BranchChip key={branch.id} active={branchId === branch.id} onClick={() => go({ branch_id: branch.id })}>
                                {branch.name}
                            </BranchChip>
                        ))}
                    </div>
                )}

                {/* One band of numbers, divided — not five bordered boxes. */}
                <dl className="border-border divide-border grid grid-cols-2 divide-x divide-y overflow-hidden rounded-xl border sm:grid-cols-4 sm:divide-y-0">
                    <Metric label="Booked hours" value={`${stats.sold} / ${stats.sellable}`} />
                    <Metric label="Occupancy" value={`${stats.occupancy}%`} />
                    <Metric label="Booked value" value={currency(stats.revenue)} />
                    <Metric label="Unpaid" value={String(stats.unpaid)} tone={stats.unpaid > 0 ? 'warning' : undefined} />
                </dl>

                {courts.length === 0 ? (
                    <p className="border-border text-body rounded-xl border border-dashed px-4 py-16 text-center">
                        No courts at this venue yet. Add one under Courts to start scheduling.
                    </p>
                ) : (
                    <div className="min-h-0 min-w-0 flex-1">
                        <SchedulerBoard
                            courts={courts}
                            reservations={reservations}
                            blocks={blocks}
                            hours={hours}
                            onBook={(court, hour) => {
                                setSeed({
                                    court_id: court.id,
                                    reservation_date: date,
                                    start_time: `${String(hour).padStart(2, '0')}:00`,
                                    end_time: `${String(hour + 1).padStart(2, '0')}:00`,
                                });
                                setBooking(true);
                            }}
                            onOpen={setOpen}
                        />
                    </div>
                )}

                <div className="text-meta flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <span className="flex items-center gap-1.5">
                        <span className="border-border bg-surface size-3 rounded-sm border" /> Free
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="bg-primary-soft border-border size-3 rounded-sm border" /> Booked
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span
                            className="border-border bg-surface-muted size-3 rounded-sm border"
                            style={{
                                backgroundImage:
                                    'repeating-linear-gradient(45deg, transparent, transparent 3px, color-mix(in srgb, var(--border-strong) 55%, transparent) 3px, color-mix(in srgb, var(--border-strong) 55%, transparent) 4px)',
                            }}
                        />{' '}
                        Closed or blocked
                    </span>
                    <span className="ml-auto">Times are club local.</span>
                </div>
            </div>

            <BookingFormDialog open={booking} onOpenChange={setBooking} courts={bookingCourts} seed={seed} />
            <BookingSheet reservation={open} onClose={() => setOpen(null)} />
        </AppLayout>
    );
}

/* min-w-0 + truncate: a grid cell will not shrink below its content, and four
   of these set a floor wide enough to push the whole page sideways on a phone. */
function Metric({ label, value, tone }: { label: string; value: string; tone?: 'warning' }) {
    return (
        <div className="min-w-0 px-4 py-3">
            <dt className="text-meta truncate">{label}</dt>
            <dd data-numeric className={cn('text-kpi mt-0.5 truncate', tone === 'warning' ? 'text-warning' : 'text-foreground')}>
                {value}
            </dd>
        </div>
    );
}

function BranchChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'text-label inline-flex min-h-9 shrink-0 items-center rounded-full border px-3.5 font-medium transition-colors',
                active ? 'border-primary bg-primary-soft text-primary' : 'border-border text-secondary hover:border-border-strong',
            )}
        >
            {children}
        </button>
    );
}

/**
 * One booking, and the single step it is waiting for.
 *
 * A sheet rather than a page: the desk is looking at the board because somebody
 * is standing in front of them, and losing the board to check a name is the
 * thing that makes a scheduler annoying to run.
 */
function BookingSheet({ reservation, onClose }: { reservation: SchedulerReservation | null; onClose: () => void }) {
    const form = useForm({});

    if (!reservation) return null;

    const step = {
        confirmed: { label: 'Check in', icon: LogIn, url: `/check-in/${reservation.id}` },
        checked_in: { label: 'Start play', icon: Play, url: `/check-in/${reservation.id}/start` },
        playing: { label: 'Finish', icon: Check, url: `/check-in/${reservation.id}/complete` },
    }[reservation.booking_status];

    const Icon = step?.icon;

    return (
        <Sheet open onOpenChange={(next) => !next && onClose()}>
            <SheetContent side="right" className="bg-surface flex w-full flex-col gap-0 sm:max-w-md">
                <SheetTitle className="sr-only">Booking {reservation.reference}</SheetTitle>

                <div className="border-border border-b px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="text-h2 text-foreground truncate">{reservation.player ?? 'Walk-in'}</h2>
                            <p data-numeric className="text-meta mt-0.5">
                                {reservation.reference}
                            </p>
                        </div>
                        <StatusBadge status={reservation.booking_status} />
                    </div>
                </div>

                <dl className="divide-border divide-y px-5">
                    <Row label="Time">
                        <span data-numeric>
                            {time12h(reservation.start_time)} – {time12h(reservation.end_time)}
                        </span>
                    </Row>
                    <Row label="Players">
                        <span className="flex items-center gap-1.5">
                            <Users className="size-3.5" aria-hidden />
                            <span data-numeric>{reservation.players_count}</span>
                        </span>
                    </Row>
                    {reservation.mobile_number && (
                        <Row label="Mobile">
                            <a href={`tel:${reservation.mobile_number}`} className="text-primary flex items-center gap-1.5 hover:underline">
                                <Phone className="size-3.5" aria-hidden />
                                <span data-numeric>{reservation.mobile_number}</span>
                            </a>
                        </Row>
                    )}
                    <Row label="Amount">
                        <span data-numeric className={cn('font-semibold', reservation.payment_status === 'paid' ? 'text-success' : 'text-warning')}>
                            {currency(reservation.amount_due)} · {reservation.payment_status}
                        </span>
                    </Row>
                </dl>

                <div className="mt-auto flex flex-col gap-2 px-5 py-4">
                    {step && Icon && (
                        <Button
                            disabled={form.processing}
                            onClick={() => form.post(step.url, { preserveScroll: true, onSuccess: onClose })}
                            size="touch"
                        >
                            <Icon className="size-4" />
                            {step.label}
                        </Button>
                    )}
                    <Button asChild variant="outline" size="touch">
                        <Link href="/check-in">Open check-in desk</Link>
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3 py-3">
            <dt className="text-meta">{label}</dt>
            <dd className="text-label text-foreground">{children}</dd>
        </div>
    );
}
