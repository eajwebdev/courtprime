import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Play, SquareCheckBig } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Check-In', href: '/check-in' }];

export default function CheckIn({ reservations }: { reservations: any[] }) {
    const post = (url: string) => router.post(url, {}, { preserveScroll: true });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Check-In" />
            <div className="space-y-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold">Check-In Desk</h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Move reservations through confirmed, checked-in, playing, and completed states.
                    </p>
                </div>
                <div className="grid gap-4">
                    {reservations.map((reservation) => (
                        <Card key={reservation.id}>
                            <CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="font-semibold">{reservation.player?.name ?? 'Walk-in Player'}</h2>
                                        <StatusBadge status={reservation.booking_status} />
                                    </div>
                                    <p className="text-muted-foreground mt-2 text-sm">
                                        {reservation.reference} - {reservation.branch?.name} - {reservation.court?.name} -{' '}
                                        {reservation.start_time.slice(0, 5)} to {reservation.end_time.slice(0, 5)}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant="outline"
                                        disabled={reservation.booking_status !== 'confirmed'}
                                        onClick={() => post(`/check-in/${reservation.id}`)}
                                    >
                                        <CheckCircle2 className="size-4" />
                                        Check In
                                    </Button>
                                    <Button
                                        variant="outline"
                                        disabled={reservation.booking_status !== 'checked_in'}
                                        onClick={() => post(`/check-in/${reservation.id}/start`)}
                                    >
                                        <Play className="size-4" />
                                        Start
                                    </Button>
                                    <Button
                                        disabled={reservation.booking_status !== 'playing'}
                                        onClick={() => post(`/check-in/${reservation.id}/complete`)}
                                    >
                                        <SquareCheckBig className="size-4" />
                                        Complete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
