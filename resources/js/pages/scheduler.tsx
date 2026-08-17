import { StatusBadge } from '@/components/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import { Fragment } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Scheduler', href: '/scheduler' }];

export default function Scheduler({
    date,
    branchId,
    branches,
    courts,
    reservations,
}: {
    date: string;
    branchId: number | null;
    branches: any[];
    courts: any[];
    reservations: any[];
}) {
    const hours = Array.from({ length: 17 }, (_, index) => index + 6);

    const changeFilters = (next: { date?: string; branch_id?: string | number | null }) => {
        router.get(
            '/scheduler',
            {
                date: next.date ?? date,
                branch_id: next.branch_id === 'all' ? null : (next.branch_id ?? branchId),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Court Scheduler" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Court Scheduler</h1>
                        <p className="text-muted-foreground mt-2 text-sm">Timeline view with server-side availability and conflict detection.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <label className="bg-card flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                            <CalendarDays className="size-4 text-pink-600" />
                            <input
                                className="bg-transparent outline-none"
                                type="date"
                                value={date}
                                onChange={(event) => changeFilters({ date: event.target.value })}
                            />
                        </label>
                        <select
                            className="bg-card h-10 rounded-md border px-3 text-sm"
                            value={branchId ?? 'all'}
                            onChange={(event) => changeFilters({ branch_id: event.target.value })}
                        >
                            <option value="all">All branches</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="bg-card overflow-x-auto rounded-lg border">
                    <div className="grid min-w-[960px]" style={{ gridTemplateColumns: `120px repeat(${courts.length}, minmax(160px, 1fr))` }}>
                        <div className="bg-card sticky left-0 z-10 border-b p-3 text-sm font-semibold">Time</div>
                        {courts.map((court) => (
                            <div key={court.id} className="border-b border-l p-3">
                                <p className="font-semibold">{court.name}</p>
                                <p className="text-muted-foreground text-xs">{court.branch?.name}</p>
                            </div>
                        ))}
                        {hours.map((hour) => (
                            <Fragment key={hour}>
                                <div key={`time-${hour}`} className="bg-card text-muted-foreground sticky left-0 z-10 border-b p-3 text-sm">
                                    {String(hour).padStart(2, '0')}:00
                                </div>
                                {courts.map((court) => {
                                    const reservation = reservations.find(
                                        (item) => item.court_id === court.id && Number(item.start_time.slice(0, 2)) === hour,
                                    );
                                    const open = court.slots?.find(
                                        (slot: any) => slot.start_time === `${String(hour).padStart(2, '0')}:00`,
                                    )?.available;

                                    return (
                                        <div key={`${court.id}-${hour}`} className="min-h-20 border-b border-l p-2">
                                            {reservation ? (
                                                <div className="rounded-md bg-pink-50 p-2 text-xs text-pink-800 dark:bg-pink-400/10 dark:text-pink-100">
                                                    <p className="font-semibold">{reservation.player?.name ?? reservation.reference}</p>
                                                    <p>
                                                        {reservation.start_time.slice(0, 5)} - {reservation.end_time.slice(0, 5)}
                                                    </p>
                                                    <StatusBadge status={reservation.booking_status} />
                                                </div>
                                            ) : (
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-1 text-xs ${open ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                                                >
                                                    {open ? 'Available' : 'Blocked'}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </Fragment>
                        ))}
                    </div>
                </div>
                <Card>
                    <CardContent className="text-muted-foreground p-4 text-sm">
                        Showing {courts.length} courts across {branches.length} branches for {date}. Booking placement is created from the
                        Reservations screen and checked server-side.
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
