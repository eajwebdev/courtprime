import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { currency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Check, Clock, Loader2, MapPin, Minus, Plus, TriangleAlert, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export type Slot = { start_time: string; end_time: string; available: boolean };

export type BookableCourt = {
    id: number;
    name: string;
    court_type: string;
    environment?: string | null;
    surface_type: string;
    capacity: number;
    standard_hourly_rate: number | string;
    member_hourly_rate: number | string | null;
    status: string;
    amenities: string[];
    has_membership_rate: boolean;
    branch: { id: number | null; name: string | null; address: string | null; organization: string | null };
    slots: Slot[];
};

const DURATIONS = [
    { label: '30m', minutes: 30 },
    { label: '1h', minutes: 60 },
    { label: '1h 30m', minutes: 90 },
    { label: '2h', minutes: 120 },
];

const toMinutes = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
};

const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** 24h to a readable 12h label, which is what players actually scan for. */
export const label12h = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const display = hour % 12 === 0 ? 12 : hour % 12;
    return `${display}:${String(minute).padStart(2, '0')} ${suffix}`;
};

/**
 * A duration is only offered when every 30-minute slot it spans is free, so the
 * user can never pick a length the court cannot actually honour.
 */
function durationFits(slots: Slot[], start: string, minutes: number) {
    const needed = minutes / 30;
    const index = slots.findIndex((slot) => slot.start_time === start);
    if (index === -1) return false;

    for (let step = 0; step < needed; step++) {
        const slot = slots[index + step];
        if (!slot || !slot.available) return false;
        if (step > 0 && toMinutes(slot.start_time) !== toMinutes(start) + step * 30) return false;
    }
    return true;
}

export function BookingPanel({ court, date, onClose }: { court: BookableCourt; date: string; onClose?: () => void }) {
    const rate = Number(court.has_membership_rate && court.member_hourly_rate ? court.member_hourly_rate : court.standard_hourly_rate);

    const availableSlots = useMemo(() => court.slots.filter((slot) => slot.available), [court.slots]);
    const [start, setStart] = useState<string | null>(availableSlots[0]?.start_time ?? null);
    const [minutes, setMinutes] = useState(60);

    /* Reset the selection whenever the court or date changes underneath us. */
    useEffect(() => {
        setStart(court.slots.find((slot) => slot.available)?.start_time ?? null);
        setMinutes(60);
    }, [court.id, date, court.slots]);

    const allowedDurations = useMemo(
        () => (start ? DURATIONS.filter((duration) => durationFits(court.slots, start, duration.minutes)) : []),
        [court.slots, start],
    );

    /* Keep the chosen duration legal for the chosen start time. */
    useEffect(() => {
        if (allowedDurations.length === 0) return;
        if (!allowedDurations.some((duration) => duration.minutes === minutes)) {
            setMinutes(allowedDurations[allowedDurations.length - 1].minutes);
        }
    }, [allowedDurations, minutes]);

    const end = start ? toTime(toMinutes(start) + minutes) : null;
    const total = (rate * minutes) / 60;

    const form = useForm({
        court_id: court.id,
        reservation_date: date,
        start_time: start ?? '',
        end_time: end ?? '',
        players_count: Math.min(4, court.capacity || 4),
        notes: '',
    });

    /* The form mirrors local state so the summary and the payload never diverge. */
    useEffect(() => {
        form.setData((current) => ({
            ...current,
            court_id: court.id,
            reservation_date: date,
            start_time: start ?? '',
            end_time: end ?? '',
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [court.id, date, start, end]);

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/me/book', {
            preserveScroll: true,
            /*
             * The server holds a row lock and re-checks availability, so a slot
             * can legitimately be taken between rendering and submitting. When
             * that happens, refetch the grid so the freshly booked slot shows as
             * unavailable instead of leaving the player staring at a slot the
             * server keeps refusing.
             */
            onError: (errors) => {
                if (errors.court_id) {
                    router.reload({ only: ['courts'] });
                }
            },
        });
    };

    const canBook = Boolean(start && end) && !form.processing;

    return (
        <form onSubmit={submit} className="flex h-full flex-col">
            <div className="border-border flex items-start justify-between gap-3 border-b px-5 py-4">
                <div className="min-w-0">
                    <p className="text-meta text-primary truncate font-semibold tracking-wide uppercase">{court.branch.organization}</p>
                    <h2 className="text-h2 text-foreground truncate">{court.name}</h2>
                    <p className="text-meta text-muted mt-0.5 flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{court.branch.name}</span>
                    </p>
                </div>
                {onClose && (
                    <Button type="button" variant="ghost" size="sm" onClick={onClose} className="lg:hidden">
                        Close
                    </Button>
                )}
            </div>

            <div className="flex-1 space-y-7 overflow-y-auto px-5 py-5">
                {form.errors.court_id && (
                    <p
                        role="alert"
                        className="border-danger/25 bg-danger-soft text-label text-danger flex items-start gap-2 rounded-lg border px-3 py-2.5 font-medium"
                    >
                        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                        {form.errors.court_id}
                    </p>
                )}
                {/* Time, a real grid of taps rather than a time input. */}
                <section>
                    <div className="flex items-baseline justify-between gap-3">
                        <Label className="text-label">Start time</Label>
                        <span className="text-meta text-muted">
                            <span data-numeric>{availableSlots.length}</span> slots open
                        </span>
                    </div>

                    {availableSlots.length === 0 ? (
                        <p className="border-border text-label text-muted mt-3 rounded-lg border border-dashed px-4 py-6 text-center">
                            No open slots on this date. Try another day.
                        </p>
                    ) : (
                        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {court.slots.map((slot) => {
                                const selected = slot.start_time === start;
                                return (
                                    <button
                                        key={slot.start_time}
                                        type="button"
                                        disabled={!slot.available}
                                        aria-pressed={selected}
                                        onClick={() => setStart(slot.start_time)}
                                        className={cn(
                                            'text-meta min-h-11 rounded-lg border px-1 font-medium transition-colors',
                                            selected && 'border-primary bg-primary text-primary-foreground',
                                            !selected && slot.available && 'border-border bg-surface text-foreground hover:border-border-strong',
                                            !slot.available && 'border-border bg-surface-muted text-muted cursor-not-allowed line-through opacity-60',
                                        )}
                                    >
                                        {label12h(slot.start_time)}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {form.errors.start_time && <p className="text-meta text-danger mt-2">{form.errors.start_time}</p>}
                </section>

                {/* Duration, only lengths the court can actually honour. */}
                {start && (
                    <section>
                        <Label className="text-label">Duration</Label>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {DURATIONS.map((duration) => {
                                const allowed = allowedDurations.some((item) => item.minutes === duration.minutes);
                                const selected = duration.minutes === minutes;
                                return (
                                    <button
                                        key={duration.minutes}
                                        type="button"
                                        disabled={!allowed}
                                        aria-pressed={selected}
                                        onClick={() => setMinutes(duration.minutes)}
                                        className={cn(
                                            'text-label min-h-11 flex-1 rounded-lg border px-3 font-medium transition-colors sm:flex-none sm:px-5',
                                            selected && allowed && 'border-primary bg-primary text-primary-foreground',
                                            !selected && allowed && 'border-border bg-surface text-foreground hover:border-border-strong',
                                            !allowed && 'border-border bg-surface-muted text-muted cursor-not-allowed opacity-60',
                                        )}
                                    >
                                        {duration.label}
                                    </button>
                                );
                            })}
                        </div>
                        {allowedDurations.length < DURATIONS.length && (
                            <p className="text-meta text-muted mt-2">Longer sessions are unavailable from this start time.</p>
                        )}
                        {form.errors.end_time && <p className="text-meta text-danger mt-2">{form.errors.end_time}</p>}
                    </section>
                )}

                {/* Players, a stepper beats a number input on a phone. */}
                <section>
                    <Label className="text-label" htmlFor="players">
                        Players
                    </Label>
                    <div className="mt-3 flex items-center gap-3">
                        <button
                            type="button"
                            aria-label="Fewer players"
                            onClick={() => form.setData('players_count', Math.max(1, form.data.players_count - 1))}
                            className="border-border bg-surface hover:border-border-strong flex size-11 items-center justify-center rounded-lg border transition-colors"
                        >
                            <Minus className="size-4" />
                        </button>
                        <output id="players" data-numeric className="text-h2 text-foreground w-12 text-center" aria-live="polite">
                            {form.data.players_count}
                        </output>
                        <button
                            type="button"
                            aria-label="More players"
                            onClick={() => form.setData('players_count', Math.min(court.capacity || 12, form.data.players_count + 1))}
                            className="border-border bg-surface hover:border-border-strong flex size-11 items-center justify-center rounded-lg border transition-colors"
                        >
                            <Plus className="size-4" />
                        </button>
                        <span className="text-meta text-muted flex items-center gap-1.5">
                            <Users className="size-3.5" aria-hidden />
                            Court fits {court.capacity}
                        </span>
                    </div>
                    {form.errors.players_count && <p className="text-meta text-danger mt-2">{form.errors.players_count}</p>}
                </section>

                <section>
                    <Label className="text-label" htmlFor="notes">
                        Notes <span className="text-muted font-normal">(optional)</span>
                    </Label>
                    <textarea
                        id="notes"
                        value={form.data.notes}
                        onChange={(event) => form.setData('notes', event.target.value)}
                        placeholder="Anything the club should know"
                        className="border-input bg-surface text-label text-foreground placeholder:text-muted focus-visible:ring-ring mt-3 min-h-20 w-full rounded-md border px-3 py-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                    />
                    {form.errors.notes && <p className="text-meta text-danger mt-2">{form.errors.notes}</p>}
                </section>
            </div>

            {/* Sticky summary. Always visible, never scrolled away from. */}
            <div className="border-border bg-surface-muted border-t px-5 py-4">
                <dl className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                        <dt className="text-meta text-muted flex items-center gap-1.5">
                            <Clock className="size-3.5" aria-hidden /> When
                        </dt>
                        <dd className="text-label text-foreground font-medium">
                            {start && end ? `${label12h(start)} to ${label12h(end)}` : 'Pick a time'}
                        </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <dt className="text-meta text-muted">Rate</dt>
                        <dd data-numeric className="text-label text-foreground">
                            {currency(rate)} / hr
                            {court.has_membership_rate && <span className="text-success ml-1.5 text-[0.6875rem] font-semibold">MEMBER</span>}
                        </dd>
                    </div>
                    <div className="border-border flex items-baseline justify-between gap-3 border-t pt-2">
                        <dt className="text-label text-foreground font-semibold">Total</dt>
                        <dd data-numeric className="text-h2 text-foreground">
                            {start ? currency(total) : '—'}
                        </dd>
                    </div>
                </dl>

                <Button type="submit" size="touch" disabled={!canBook} className="mt-4 w-full">
                    {form.processing ? (
                        <>
                            <Loader2 className="size-4 animate-spin" /> Confirming
                        </>
                    ) : (
                        <>
                            <Check className="size-4" /> Confirm booking
                        </>
                    )}
                </Button>
                <p className="text-meta text-muted mt-2 text-center">Pay at the club. Free cancellation up to 2 hours before.</p>
            </div>
        </form>
    );
}
