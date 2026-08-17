import { StatusBadge } from '@/components/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CalendarClock, CheckCircle2, RadioTower, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Operations', href: '/operations' }];

export default function Operations({ metrics, queue, courts }: { metrics: Record<string, number>; queue: any[]; courts: any[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Operations" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Operations Dashboard</h1>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Front-desk operating view for check-ins, courts, reservation queue, and active play.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium" href="/scheduler">
                            Scheduler
                        </Link>
                        <Link
                            className="bg-primary text-primary-foreground inline-flex h-10 items-center rounded-md px-4 text-sm font-medium"
                            href="/check-in"
                        >
                            Check-In
                        </Link>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-5">
                    <Metric icon={CheckCircle2} label="Check-Ins" value={metrics.checkIns} />
                    <Metric icon={RadioTower} label="Playing" value={metrics.playing} />
                    <Metric icon={CalendarClock} label="Upcoming" value={metrics.upcoming} />
                    <Metric icon={RadioTower} label="Available Courts" value={metrics.availableCourts} />
                    <Metric icon={Users} label="Active Players" value={metrics.activePlayers} />
                </div>
                <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Today&apos;s Operational Queue</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {queue.map((reservation) => (
                                <div key={reservation.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                                    <div>
                                        <p className="font-semibold">{reservation.player?.name ?? reservation.reference}</p>
                                        <p className="text-muted-foreground text-sm">
                                            {reservation.court?.name} - {reservation.start_time.slice(0, 5)} to {reservation.end_time.slice(0, 5)}
                                        </p>
                                    </div>
                                    <StatusBadge status={reservation.booking_status} />
                                    <Link href="/check-in" className="text-sm font-semibold text-pink-600">
                                        Manage
                                    </Link>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Court Readiness</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2">
                            {courts.map((court) => (
                                <div key={court.id} className="rounded-lg border p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <p className="font-semibold">{court.name}</p>
                                            <p className="text-muted-foreground text-xs">{court.branch?.code}</p>
                                        </div>
                                        <StatusBadge status={court.status} />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
    return (
        <Card>
            <CardContent className="p-4">
                <Icon className="size-5 text-pink-600" />
                <p className="text-muted-foreground mt-3 text-sm">{label}</p>
                <p className="text-2xl font-semibold">{value}</p>
            </CardContent>
        </Card>
    );
}
