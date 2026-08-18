import { BookingFormDialog, type BookingCourt, type BookingSeed } from '@/components/booking/booking-form-dialog';
import { MonthCalendar, type DayLoad } from '@/components/booking/month-calendar';
import { EmptyState } from '@/components/empty-state';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { currency, time12h } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, Clock, Plus, Users } from 'lucide-react';
import { useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payload from ReservationController. */

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Reservations', href: '/reservations' }];

type Props = {
    date: string;
    month: string;
    monthLoad: Record<string, DayLoad>;
    reservations: any[];
    courts: BookingCourt[];
    branches: any[];
};

/**
 * The booking calendar.
 *
 * Month on the left for shape, the chosen day in full on the right, and the
 * form in a dialog rather than parked down the side of the screen. Everything
 * here answers "what is on, and when", which is the only thing this page was
 * ever opened for.
 */
export default function Reservations({ date, month, monthLoad, reservations, courts }: Props) {
    const [seed, setSeed] = useState<BookingSeed>({});
    const [open, setOpen] = useState(false);

    const go = (next: string) => router.get('/reservations', { date: next }, { preserveState: true, preserveScroll: true });

    const book = (extra: BookingSeed = {}) => {
        setSeed({ reservation_date: date, ...extra });
        setOpen(true);
    };

    const selected = new Date(`${date}T00:00:00`);
    const totalDue = reservations.reduce((sum, entry) => sum + Number(entry.amount_due ?? 0), 0);
    const unpaid = reservations.filter((entry) => entry.payment_status !== 'paid').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reservations" />

            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
                <div className="flex flex-col gap-5">
                    <MonthCalendar month={month} selected={date} load={monthLoad} onSelect={go} onMonthChange={go} />

                    <div className="border-border flex flex-col gap-2 border-t pt-4">
                        <Button type="button" onClick={() => book()} className="w-full">
                            <Plus className="size-4" />
                            New booking
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href={`/scheduler?date=${date}`}>
                                <CalendarDays className="size-4" />
                                Open day on the grid
                            </Link>
                        </Button>
                    </div>
                </div>

                <section className="min-w-0">
                    <header className="border-border mb-4 flex flex-wrap items-end justify-between gap-3 border-b pb-4">
                        <div>
                            <h1 className="text-h1 text-foreground">
                                {selected.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h1>
                            <p className="text-meta text-muted mt-1">
                                <span data-numeric className="text-foreground font-semibold">
                                    {reservations.length}
                                </span>{' '}
                                {reservations.length === 1 ? 'booking' : 'bookings'}
                                {reservations.length > 0 && (
                                    <>
                                        {' · '}
                                        <span data-numeric>{currency(totalDue)}</span> booked
                                        {unpaid > 0 && (
                                            <>
                                                {' · '}
                                                <span data-numeric className="text-warning font-medium">
                                                    {unpaid}
                                                </span>{' '}
                                                unpaid
                                            </>
                                        )}
                                    </>
                                )}
                            </p>
                        </div>
                    </header>

                    {reservations.length === 0 ? (
                        <EmptyState
                            title="Nothing booked this day"
                            description="Take a booking, or pick another date on the calendar."
                            artwork="/cp-paddle4.png"
                            action={
                                <Button onClick={() => book()}>
                                    <Plus className="size-4" />
                                    New booking
                                </Button>
                            }
                        />
                    ) : (
                        <ul className="divide-border border-border divide-y rounded-xl border">
                            {reservations.map((entry) => (
                                <li key={entry.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                                    {/* Fixed width so the times form a column
                                        the eye can run down, and wide enough
                                        that "10:00 AM to 11:30 AM" stays on one
                                        line. */}
                                    <p data-numeric className="text-label text-foreground w-40 shrink-0 font-semibold">
                                        {time12h(entry.start_time)}
                                        <span className="text-muted font-normal"> to {time12h(entry.end_time)}</span>
                                    </p>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-label text-foreground truncate font-medium">{entry.player ?? 'Walk-in'}</p>
                                        <p className="text-meta text-muted truncate">
                                            {entry.court}
                                            {entry.branch ? ` · ${entry.branch}` : ''} · {entry.reference}
                                        </p>
                                    </div>

                                    <p className="text-meta text-muted hidden items-center gap-1 sm:flex">
                                        <Users className="size-3.5" aria-hidden />
                                        <span data-numeric>{entry.players_count}</span>
                                    </p>

                                    <StatusBadge status={entry.booking_status} />

                                    <div className="w-24 text-right">
                                        <p data-numeric className="text-label text-foreground font-semibold">
                                            {currency(entry.amount_due)}
                                        </p>
                                        <p className={cn('text-meta', entry.payment_status === 'paid' ? 'text-success' : 'text-warning')}>
                                            {entry.payment_status}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {reservations.length > 0 && (
                        <p className="text-meta text-muted mt-3 flex items-center gap-1.5">
                            <Clock className="size-3.5" aria-hidden />
                            Times are club local.
                        </p>
                    )}
                </section>
            </div>

            <BookingFormDialog open={open} onOpenChange={setOpen} courts={courts} seed={seed} />
        </AppLayout>
    );
}
