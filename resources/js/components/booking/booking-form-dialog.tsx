import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { currency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect, type FormEvent, type ReactNode } from 'react';

export type BookingCourt = {
    id: number;
    name: string;
    branch?: { name?: string; code?: string } | null;
    standard_hourly_rate?: string | number | null;
};

export type BookingSeed = {
    court_id?: number | string;
    reservation_date?: string;
    start_time?: string;
    end_time?: string;
};

/** 30 minutes past the given time, which is the slot size the scheduler uses. */
function plusThirty(time: string) {
    const [hour, minute] = time.split(':').map(Number);
    const total = hour * 60 + minute + 30;

    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function hoursBetween(start: string, end: string) {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);

    return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
}

/**
 * Taking a booking, in a dialog.
 *
 * The form used to sit permanently down the left of the reservations page,
 * taking a third of the screen whether or not anyone was booking anything. It
 * belongs in front of you when you are taking a booking and nowhere at all the
 * rest of the time.
 *
 * It opens seeded: clicking an empty slot on the scheduler brings the court,
 * the date and the time with it, so the common case is a name and a save.
 */
export function BookingFormDialog({
    open,
    onOpenChange,
    courts,
    seed,
    trigger,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    courts: BookingCourt[];
    seed: BookingSeed;
    trigger?: ReactNode;
}) {
    const form = useForm({
        court_id: seed.court_id ?? courts[0]?.id ?? '',
        player_name: '',
        player_email: '',
        player_mobile_number: '',
        reservation_date: seed.reservation_date ?? '',
        start_time: seed.start_time ?? '18:00',
        end_time: seed.end_time ?? '19:00',
        players_count: 4,
        reservation_type: 'court_booking',
        source: 'front_desk',
        payment_status: 'unpaid',
        booking_status: 'confirmed',
        notes: '',
    });

    /*
     * Reseed each time it opens rather than on every seed change, so typing in
     * the dialog is never interrupted by a background poll or a filter change
     * on the page underneath.
     */
    useEffect(() => {
        if (!open) return;

        form.setDefaults();
        form.setData((current) => ({
            ...current,
            court_id: seed.court_id ?? current.court_id,
            reservation_date: seed.reservation_date ?? current.reservation_date,
            start_time: seed.start_time ?? current.start_time,
            end_time: seed.end_time ?? (seed.start_time ? plusThirty(seed.start_time) : current.end_time),
        }));
        form.clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const court = courts.find((entry) => String(entry.id) === String(form.data.court_id));
    const rate = Number(court?.standard_hourly_rate ?? 0);
    const duration = hoursBetween(form.data.start_time, form.data.end_time);
    const estimate = rate * duration;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/reservations', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger}
            <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>New booking</DialogTitle>
                    <DialogDescription>Takes the court off the grid straight away. Conflicts are rejected by the server.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="Player name" htmlFor="player_name" error={form.errors.player_name} className="sm:col-span-2">
                            <Input
                                id="player_name"
                                value={form.data.player_name}
                                onChange={(event) => form.setData('player_name', event.target.value)}
                                placeholder="Who is the court for"
                                autoComplete="off"
                            />
                        </FormField>

                        <FormField label="Mobile" htmlFor="player_mobile_number" hint="Optional" error={form.errors.player_mobile_number}>
                            <Input
                                id="player_mobile_number"
                                value={form.data.player_mobile_number}
                                onChange={(event) => form.setData('player_mobile_number', event.target.value)}
                                inputMode="tel"
                            />
                        </FormField>

                        <FormField label="Email" htmlFor="player_email" hint="Optional" error={form.errors.player_email}>
                            <Input
                                id="player_email"
                                type="email"
                                value={form.data.player_email}
                                onChange={(event) => form.setData('player_email', event.target.value)}
                            />
                        </FormField>
                    </div>

                    <div className="border-border border-t pt-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField label="Court" htmlFor="court_id" error={form.errors.court_id} className="sm:col-span-2">
                                <select
                                    id="court_id"
                                    value={form.data.court_id}
                                    onChange={(event) => form.setData('court_id', Number(event.target.value))}
                                    className="border-border bg-surface text-foreground text-body h-10 w-full rounded-md border px-3"
                                >
                                    {courts.map((entry) => (
                                        <option key={entry.id} value={entry.id}>
                                            {entry.branch?.name ? `${entry.branch.name} · ` : ''}
                                            {entry.name}
                                        </option>
                                    ))}
                                </select>
                            </FormField>

                            <FormField label="Date" htmlFor="reservation_date" error={form.errors.reservation_date} className="sm:col-span-2">
                                <Input
                                    id="reservation_date"
                                    type="date"
                                    value={form.data.reservation_date}
                                    onChange={(event) => form.setData('reservation_date', event.target.value)}
                                />
                            </FormField>

                            <FormField label="Start" htmlFor="start_time" error={form.errors.start_time}>
                                <Input
                                    id="start_time"
                                    type="time"
                                    value={form.data.start_time}
                                    onChange={(event) => {
                                        const start = event.target.value;
                                        form.setData((current) => ({
                                            ...current,
                                            start_time: start,
                                            /* Keep the end ahead of the start rather than
                                               letting the server reject it later. */
                                            end_time: current.end_time <= start ? plusThirty(start) : current.end_time,
                                        }));
                                    }}
                                />
                            </FormField>

                            <FormField label="End" htmlFor="end_time" error={form.errors.end_time}>
                                <Input
                                    id="end_time"
                                    type="time"
                                    value={form.data.end_time}
                                    onChange={(event) => form.setData('end_time', event.target.value)}
                                />
                            </FormField>

                            <FormField label="Players" htmlFor="players_count" error={form.errors.players_count}>
                                <Input
                                    id="players_count"
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={form.data.players_count}
                                    onChange={(event) => form.setData('players_count', Number(event.target.value))}
                                />
                            </FormField>

                            <FormField label="Payment" htmlFor="payment_status">
                                <select
                                    id="payment_status"
                                    value={form.data.payment_status}
                                    onChange={(event) => form.setData('payment_status', event.target.value)}
                                    className="border-border bg-surface text-foreground text-body h-10 w-full rounded-md border px-3"
                                >
                                    <option value="unpaid">Unpaid</option>
                                    <option value="partial">Partial</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </FormField>
                        </div>
                    </div>

                    <FormField label="Notes" htmlFor="notes" hint="Optional">
                        <textarea
                            id="notes"
                            value={form.data.notes}
                            onChange={(event) => form.setData('notes', event.target.value)}
                            rows={2}
                            className="border-border bg-surface text-foreground text-body w-full rounded-md border px-3 py-2"
                        />
                    </FormField>

                    {duration > 0 && rate > 0 && (
                        <p className="text-meta text-secondary border-border bg-surface-muted rounded-lg border px-3 py-2">
                            <span data-numeric>{duration}</span> {duration === 1 ? 'hour' : 'hours'} at <span data-numeric>{currency(rate)}</span> is
                            about{' '}
                            <span data-numeric className="text-foreground font-semibold">
                                {currency(estimate)}
                            </span>
                        </p>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing || form.data.player_name.trim().length < 2}>
                            {form.processing ? <Loader2 className="size-4 animate-spin" /> : 'Create booking'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function FormField({
    label,
    htmlFor,
    hint,
    error,
    className,
    children,
}: {
    label: string;
    htmlFor: string;
    hint?: string;
    error?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <Label htmlFor={htmlFor} className="flex items-baseline gap-1.5">
                {label}
                {hint && <span className="text-meta text-muted font-normal">{hint}</span>}
            </Label>
            {children}
            {error && (
                <p role="alert" className="text-meta text-danger">
                    {error}
                </p>
            )}
        </div>
    );
}
