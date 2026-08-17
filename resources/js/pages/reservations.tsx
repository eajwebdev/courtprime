import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { currency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Reservations', href: '/reservations' }];

export default function Reservations({ reservations, courts }: { reservations: any; courts: any[] }) {
    const form = useForm({
        court_id: courts[0]?.id ?? '',
        player_name: '',
        player_email: '',
        player_mobile_number: '',
        reservation_date: new Date().toISOString().slice(0, 10),
        start_time: '18:00',
        end_time: '19:00',
        players_count: 4,
        reservation_type: 'court_booking',
        source: 'front_desk',
        payment_status: 'unpaid',
        booking_status: 'confirmed',
        notes: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/reservations', {
            preserveScroll: true,
            onSuccess: () => form.reset('player_name', 'player_email', 'player_mobile_number', 'notes'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reservations" />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[0.9fr_1.6fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Quick Booking</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <Field
                                label="Player Name"
                                value={form.data.player_name}
                                onChange={(value) => form.setData('player_name', value)}
                                error={form.errors.player_name}
                            />
                            <Field
                                label="Player Email"
                                type="email"
                                value={form.data.player_email}
                                onChange={(value) => form.setData('player_email', value)}
                            />
                            <div className="space-y-2">
                                <Label>Court</Label>
                                <select
                                    className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                                    value={form.data.court_id}
                                    onChange={(event) => form.setData('court_id', Number(event.target.value))}
                                >
                                    {courts.map((court) => (
                                        <option key={court.id} value={court.id}>
                                            {court.branch?.code} - {court.name}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.court_id && <p className="text-xs text-red-600">{form.errors.court_id}</p>}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <Field
                                    label="Date"
                                    type="date"
                                    value={form.data.reservation_date}
                                    onChange={(value) => form.setData('reservation_date', value)}
                                />
                                <Field
                                    label="Start"
                                    type="time"
                                    value={form.data.start_time}
                                    onChange={(value) => form.setData('start_time', value)}
                                />
                                <Field label="End" type="time" value={form.data.end_time} onChange={(value) => form.setData('end_time', value)} />
                            </div>
                            <Button disabled={form.processing} className="bg-primary w-full">
                                Create Reservation
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Reservation Board</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {reservations.data.map((reservation: any) => (
                            <div key={reservation.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                                <div>
                                    <p className="font-semibold">{reservation.reference}</p>
                                    <p className="text-muted-foreground text-sm">
                                        {reservation.player?.name ?? 'Walk-in'} - {reservation.court?.name} - {reservation.start_time.slice(0, 5)} to{' '}
                                        {reservation.end_time.slice(0, 5)}
                                    </p>
                                </div>
                                <StatusBadge status={reservation.booking_status} />
                                <div className="text-right">
                                    <p className="font-semibold">{currency(reservation.amount_due)}</p>
                                    <p className="text-muted-foreground text-xs">{reservation.payment_status}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function Field({
    label,
    value,
    onChange,
    error,
    type = 'text',
}: {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    error?: string;
    type?: string;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}
