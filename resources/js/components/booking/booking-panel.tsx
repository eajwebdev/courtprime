import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { currency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Check, Clock, Loader2, LogIn, MapPin, Minus, Plus, TriangleAlert, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

/**
 * Why a slot is not free.
 *
 * `key` is stable across every slot one booking covers, so the grid can merge
 * them into a single named block instead of matching on the label. Names arrive
 * already shortened to a first name and last initial — see
 * CourtAvailabilityService.
 */
export type SlotHold = {
    key: string;
    kind: 'booked' | 'open_play' | 'tournament' | 'coaching' | 'blocked' | 'closed';
    title: string;
    detail: string | null;
    reference: string | null;
    starts_at: string | null;
    ends_at: string | null;
    is_yours: boolean;
};

export type Slot = {
    start_time: string;
    end_time: string;
    available: boolean;
    status?: string;
    hold?: SlotHold | null;
};

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
    branch: {
        id: number | null;
        name: string | null;
        address: string | null;
        organization: string | null;
        /* The club's own details, since booking is where clubs are reached now. */
        contact_number?: string | null;
        operating_hours?: { opens?: string; closes?: string } | null;
        links?: Record<string, string> | null;
    };
    slots: Slot[];
};

/** One slot, one hour. The server generates the day the same way. */
export const SLOT_MINUTES = 60;

/** Four hours is the longest one booking may run. Enforced server-side too. */
export const MAX_HOURS = 4;

/*
 * Courts are sold by the hour. Half hours went: nobody plays thirty minutes of
 * pickleball, and offering it fragmented the day into gaps too short to sell.
 * Two hours covers a normal game; four is the ceiling, and a group that wants
 * the whole afternoon books the rest as a second slot.
 */
const DURATIONS = Array.from({ length: MAX_HOURS }, (_, index) => ({
    label: `${index + 1}h`,
    minutes: (index + 1) * SLOT_MINUTES,
}));

/* Always offered, so a short booking never has to hunt. Anything longer only
   appears when the court can actually honour it. */
const CORE_MINUTES = 120;

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
 * A duration is only offered when every hour it spans is free and it stays
 * inside the four-hour ceiling, so the user can never pick a length the court
 * cannot honour or the server would reject.
 */
function durationFits(slots: Slot[], start: string, minutes: number) {
    if (minutes > MAX_HOURS * SLOT_MINUTES) return false;

    const needed = minutes / SLOT_MINUTES;
    const index = slots.findIndex((slot) => slot.start_time === start);
    if (index === -1) return false;

    for (let step = 0; step < needed; step++) {
        const slot = slots[index + step];
        if (!slot || !slot.available) return false;
        /* Consecutive on the clock, not merely consecutive in the array. */
        if (step > 0 && toMinutes(slot.start_time) !== toMinutes(start) + step * SLOT_MINUTES) return false;
    }
    return true;
}

export function BookingPanel({
    court,
    date,
    initialStart = null,
    initialMinutes = null,
    signedIn = true,
    onClose,
}: {
    court: BookableCourt;
    date: string;
    /** A start time tapped straight from the court list. */
    initialStart?: string | null;
    /** A block length dragged out on the grid. */
    initialMinutes?: number | null;
    /** A visitor can pick a slot; taking it is what needs an account. */
    signedIn?: boolean;
    onClose?: () => void;
}) {
    const rate = Number(court.has_membership_rate && court.member_hourly_rate ? court.member_hourly_rate : court.standard_hourly_rate);

    const availableSlots = useMemo(() => court.slots.filter((slot) => slot.available), [court.slots]);

    const [start, setStart] = useState<string | null>(initialStart ?? availableSlots[0]?.start_time ?? null);
    const [minutes, setMinutes] = useState(initialMinutes ?? 60);

    /* Reset the selection whenever the court or date changes underneath us. */
    useEffect(() => {
        setStart(initialStart ?? court.slots.find((slot) => slot.available)?.start_time ?? null);
        setMinutes(initialMinutes ?? 60);
    }, [court.id, date, court.slots, initialStart, initialMinutes]);

    const allowedDurations = useMemo(
        () => (start ? DURATIONS.filter((duration) => durationFits(court.slots, start, duration.minutes)) : []),
        [court.slots, start],
    );

    /* Eight chips where six are dead is noise. The long tail is only rendered
       when this start time can actually reach it. */
    const offeredDurations = useMemo(
        () => DURATIONS.filter((duration) => duration.minutes <= CORE_MINUTES || allowedDurations.some((item) => item.minutes === duration.minutes)),
        [allowedDurations],
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

        /*
         * A visitor gets this far on purpose: they can see what is free and
         * choose a time without an account. Signing in happens here, carrying
         * the court, the day and the time, so they come back to the slot they
         * picked rather than to an empty grid.
         */
        if (!signedIn) {
            const back = `/me/book?date=${encodeURIComponent(date)}&court=${court.id}&start=${encodeURIComponent(start ?? '')}&minutes=${minutes}`;
            window.location.href = `/login?intended=${encodeURIComponent(back)}`;

            return;
        }

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
            {/* Only the bottom sheet passes onClose, so the grabber only shows there. */}
            {onClose && <span aria-hidden className="bg-border mx-auto mt-2 h-1 w-9 shrink-0 rounded-full" />}

            <div className="border-border flex items-start justify-between gap-3 border-b px-4 py-3.5 sm:px-5 sm:py-4">
                <div className="min-w-0">
                    <p className="text-meta text-primary truncate font-semibold tracking-wide uppercase">{court.branch.organization}</p>
                    <h2 className="text-h2 text-foreground truncate">{court.name}</h2>
                    <p className="text-meta text-muted mt-0.5 flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{court.branch.name}</span>
                    </p>
                </div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close booking"
                        className="bg-surface-muted text-secondary hover:text-foreground -mt-0.5 -mr-1 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors lg:hidden"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:space-y-7 sm:px-5">
                {form.errors.court_id && (
                    <p
                        role="alert"
                        className="border-danger/25 bg-danger-soft text-label text-danger flex items-start gap-2 rounded-lg border px-3 py-2.5 font-medium"
                    >
                        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                        {form.errors.court_id}
                    </p>
                )}
                {/*
                 * The time comes from the grid. A second full picker of every
                 * 30-minute slot in the day sat directly under it and did the
                 * same job twice, so this states what was dragged and leaves
                 * changing it to the grid.
                 */}
                <section>
                    <Label className="text-label">Your slot</Label>

                    {start ? (
                        <div className="border-border bg-surface-muted mt-3 flex items-center gap-3 rounded-lg border px-4 py-3">
                            <Clock className="text-primary size-4 shrink-0" aria-hidden />
                            <p data-numeric className="text-h3 text-foreground">
                                {label12h(start)}
                                {end && <span className="text-secondary font-normal"> to {label12h(end)}</span>}
                            </p>
                        </div>
                    ) : (
                        <p className="border-border text-label text-muted mt-3 rounded-lg border border-dashed px-4 py-6 text-center">
                            Drag a block on the grid to choose a time.
                        </p>
                    )}

                    {form.errors.start_time && <p className="text-meta text-danger mt-2">{form.errors.start_time}</p>}
                </section>

                {/* Duration, only lengths the court can actually honour. */}
                {start && (
                    <section>
                        <Label className="text-label">Duration</Label>
                        {/* A fixed four-up grid rather than a wrapping row: eight
                            options wrap into ragged lines of different widths. */}
                        <div className="mt-3 grid grid-cols-4 gap-2">
                            {offeredDurations.map((duration) => {
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
                                            'text-meta min-h-11 truncate rounded-lg border px-1 font-medium transition-colors',
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
                        {allowedDurations.length > 0 && allowedDurations.length < offeredDurations.length && (
                            <p className="text-meta text-muted mt-2">
                                Longest available from this start time is {allowedDurations[allowedDurations.length - 1].label}.
                            </p>
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
            {/* Sticky summary. pb clears the phone home indicator; env() is 0 elsewhere. */}
            <div className="border-border bg-surface-muted border-t px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-5">
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
                    ) : signedIn ? (
                        <>
                            <Check className="size-4" /> Confirm booking
                        </>
                    ) : (
                        /* Says where the tap goes. Nobody likes a button that
                           turns out to be a login wall. */
                        <>
                            <LogIn className="size-4" /> Sign in to book
                        </>
                    )}
                </Button>
                <p className="text-meta text-muted mt-2 text-center">Pay at the club. Free cancellation up to 2 hours before.</p>
            </div>
        </form>
    );
}
