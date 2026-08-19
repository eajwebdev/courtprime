import { label12h, MAX_HOURS, SLOT_MINUTES, type BookableCourt, type SlotHold } from '@/components/booking/booking-panel';
import { currency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type GridSelection = { court: BookableCourt; start: string; minutes: number };

type Drag = { courtId: number; from: number; to: number };

/* Hatching, so "booked" is not conveyed by colour alone. */
const BOOKED_HATCH =
    'repeating-linear-gradient(45deg, transparent, transparent 5px, color-mix(in srgb, var(--border-strong) 55%, transparent) 5px, color-mix(in srgb, var(--border-strong) 55%, transparent) 6px)';

const rateOf = (court: BookableCourt) =>
    Number(court.has_membership_rate && court.member_hourly_rate ? court.member_hourly_rate : court.standard_hourly_rate);

/** What a held block is called in the legend and read out to a screen reader. */
const KIND_LABEL: Record<SlotHold['kind'], string> = {
    booked: 'Booked',
    open_play: 'Open play',
    tournament: 'Tournament',
    coaching: 'Coaching',
    blocked: 'Unavailable',
    closed: 'Court closed',
};

/* The full sentence, for the hover tooltip and the accessible name. Everything
   here is already public: a short name, what it is, and when it ends. */
const describe = (court: BookableCourt, time: string, hold: SlotHold) =>
    [
        `${court.name} at ${label12h(time)}`,
        hold.is_yours ? 'your booking' : `${KIND_LABEL[hold.kind].toLowerCase()} — ${hold.title}`,
        hold.starts_at && hold.ends_at ? `${label12h(hold.starts_at)} to ${label12h(hold.ends_at)}` : null,
        hold.detail,
        hold.reference,
    ]
        .filter(Boolean)
        .join(' · ');

/**
 * A courts-by-time booking grid you drag across.
 *
 * One row is one hour, which is how courts are sold. Press a free cell and drag
 * down the same column to take a longer block; the range stops dead at the first
 * booked slot and at four hours, so a selection can never span something already
 * taken or run past what the server will accept. A plain click takes a single
 * hour, which is also what the keyboard does — the drag is an accelerator, never
 * the only way in.
 */
export function CourtGrid({
    courts,
    times,
    highlightCourtId = null,
    selection = null,
    onSelect,
}: {
    courts: BookableCourt[];
    /** Start times to show as rows, already filtered by time of day. */
    times: string[];
    /** The court a deep link arrived for, marked so it is findable. */
    highlightCourtId?: number | null;
    /** The block currently loaded in the booking panel. */
    selection?: { courtId: number; start: string; minutes: number } | null;
    onSelect: (selection: GridSelection) => void;
}) {
    const [drag, setDrag] = useState<Drag | null>(null);
    /* The ref is what the window listeners read: they are registered once per
       drag and would otherwise close over the state from the render that
       started it. */
    const dragRef = useRef<Drag | null>(null);

    /* Slots by court, keyed on start time, so a cell lookup is O(1). */
    const slotBy = useMemo(() => {
        const map = new Map<number, Map<string, BookableCourt['slots'][number]>>();
        for (const court of courts) {
            map.set(court.id, new Map(court.slots.map((slot) => [slot.start_time, slot])));
        }
        return map;
    }, [courts]);

    const isOpen = useCallback((courtId: number, index: number) => slotBy.get(courtId)?.get(times[index])?.available ?? false, [slotBy, times]);

    /** What is holding a cell, or null when it is free. */
    const holdAt = useCallback(
        (courtId: number, index: number): SlotHold | null => slotBy.get(courtId)?.get(times[index])?.hold ?? null,
        [slotBy, times],
    );

    /*
     * A drag stops at the first booked cell rather than jumping over it, and at
     * the four-hour ceiling rather than running to the end of the day. Stopping
     * beats refusing: the block simply will not grow past four rows, so nobody
     * drags out six hours and then gets told no on submit.
     */
    const clamp = useCallback(
        (courtId: number, from: number, to: number) => {
            const step = to >= from ? 1 : -1;
            let last = from;

            for (let index = from; step > 0 ? index <= to : index >= to; index += step) {
                if (!isOpen(courtId, index)) break;
                if (Math.abs(index - from) + 1 > MAX_HOURS) break;
                last = index;
            }

            return last;
        },
        [isOpen],
    );

    const commit = useCallback(
        (selection: { courtId: number; from: number; to: number }) => {
            const court = courts.find((entry) => entry.id === selection.courtId);
            if (!court) return;

            const low = Math.min(selection.from, selection.to);
            const high = Math.max(selection.from, selection.to);

            onSelect({ court, start: times[low], minutes: (high - low + 1) * SLOT_MINUTES });
        },
        [courts, onSelect, times],
    );

    /*
     * The drag is tracked on the window, not on the cell.
     *
     * It used to rely on pointer capture and the origin cell's own pointerup.
     * Release the button anywhere that event did not reach — outside the grid,
     * outside the window, a pointercancel from the browser — and the drag never
     * committed: the preview stayed painted on the grid and the panel kept
     * whatever was selected before. Window listeners always fire.
     */
    const beginDrag = useCallback(
        (courtId: number, index: number) => {
            const started: Drag = { courtId, from: index, to: index };
            dragRef.current = started;
            setDrag(started);

            const move = (event: PointerEvent) => {
                const current = dragRef.current;
                if (!current) return;

                const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
                const cell = element?.closest<HTMLElement>('[data-cell]');
                if (!cell || Number(cell.dataset.court) !== current.courtId) return;

                const next = clamp(current.courtId, current.from, Number(cell.dataset.index));
                if (next === current.to) return;

                const updated = { ...current, to: next };
                dragRef.current = updated;
                setDrag(updated);
            };

            const finish = () => {
                window.removeEventListener('pointermove', move);
                window.removeEventListener('pointerup', finish);
                window.removeEventListener('pointercancel', finish);

                const current = dragRef.current;
                dragRef.current = null;
                setDrag(null);

                if (current) commit(current);
            };

            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', finish);
            window.addEventListener('pointercancel', finish);
        },
        [clamp, commit],
    );

    /* A drag left half-finished by an unmount must not keep listening. */
    useEffect(
        () => () => {
            dragRef.current = null;
        },
        [],
    );

    /* The committed block stays painted while the panel is open, so the grid
       and the panel can never disagree about what was chosen. */
    const chosen = useMemo(() => {
        if (!selection) return null;

        const from = times.indexOf(selection.start);
        if (from === -1) return null;

        return { courtId: selection.courtId, from, to: from + Math.max(1, selection.minutes / SLOT_MINUTES) - 1 };
    }, [selection, times]);

    /* The "Yours" key only earns its place when one of these is theirs. */
    const mine = useMemo(() => courts.some((court) => court.slots.some((slot) => slot.hold?.is_yours)), [courts]);

    const columns = `3.5rem repeat(${courts.length}, minmax(5.5rem, 1fr))`;

    return (
        <div className="border-border bg-surface overflow-hidden rounded-xl border">
            <div className="overflow-x-auto">
                <div className="min-w-max">
                    {/* Header */}
                    <div className="border-border bg-surface-muted grid border-b" style={{ gridTemplateColumns: columns }}>
                        <span className="bg-surface-muted sticky left-0 z-20" />
                        {courts.map((court) => (
                            <div
                                key={court.id}
                                className={cn(
                                    'border-border truncate border-l px-2 py-2 text-center',
                                    court.id === highlightCourtId && 'border-b-primary bg-primary-soft border-b-2',
                                )}
                            >
                                <p
                                    className={cn(
                                        'text-meta truncate font-semibold',
                                        court.id === highlightCourtId ? 'text-primary' : 'text-foreground',
                                    )}
                                >
                                    {court.name}
                                </p>
                                <p data-numeric className="text-muted truncate text-[0.6875rem]">
                                    {currency(rateOf(court))}/hr
                                </p>
                            </div>
                        ))}
                    </div>

                    {/*
                     * Rows.
                     *
                     * The horizontal rule lives on each cell rather than on the
                     * row, so the cells of one booking can drop the line between
                     * them and read as a single block with one name on it.
                     */}
                    {times.map((time, index) => {
                        const lastRow = index === times.length - 1;

                        return (
                            <div key={time} className="grid" style={{ gridTemplateColumns: columns }}>
                                <span
                                    className={cn(
                                        'border-border bg-surface text-muted sticky left-0 z-20 flex h-11 items-center justify-end pr-2 text-[0.6875rem] font-medium',
                                        !lastRow && 'border-b',
                                    )}
                                >
                                    {/* Only the hour reads at a glance; the half hour is implied. */}
                                    <span data-numeric>{time.endsWith(':00') ? label12h(time).replace(':00', '') : ''}</span>
                                </span>

                                {courts.map((court) => {
                                    const open = isOpen(court.id, index);
                                    const dragging =
                                        drag?.courtId === court.id && index >= Math.min(drag.from, drag.to) && index <= Math.max(drag.from, drag.to);
                                    const picked = !drag && chosen?.courtId === court.id && index >= chosen.from && index <= chosen.to;
                                    const active = dragging || picked;

                                    const hold = open ? null : holdAt(court.id, index);
                                    /* One booking can cover several rows. Only the
                                       first of them carries the label, and the ones
                                       under it lose their top rule. */
                                    const opensRun = !!hold && holdAt(court.id, index - 1)?.key !== hold.key;
                                    const closesRun = !!hold && holdAt(court.id, index + 1)?.key !== hold.key;

                                    let rows = 1;
                                    if (opensRun) {
                                        while (index + rows < times.length && holdAt(court.id, index + rows)?.key === hold!.key) rows++;
                                    }

                                    return (
                                        <button
                                            key={court.id}
                                            type="button"
                                            data-cell
                                            data-court={court.id}
                                            data-index={index}
                                            /*
                                             * Held cells are aria-disabled rather than
                                             * disabled. A disabled button receives no
                                             * mouse events, so its tooltip never opens
                                             * and it drops out of the tab order — which
                                             * would put the name, the end time and the
                                             * reference out of reach of exactly the
                                             * people who cannot read them off the block.
                                             * Pressing one still does nothing: the drag
                                             * only ever starts on a free cell.
                                             */
                                            disabled={!open && !hold}
                                            aria-disabled={!open}
                                            aria-label={hold ? describe(court, time, hold) : `${court.name} at ${label12h(time)} — free`}
                                            title={hold ? describe(court, time, hold) : undefined}
                                            onPointerDown={(event) => {
                                                if (!open) return;
                                                /* Without this the browser starts a text
                                                   selection and swallows the drag. */
                                                event.preventDefault();
                                                beginDrag(court.id, index);
                                            }}
                                            /* pan-x leaves horizontal scrolling to the browser
                                               while vertical drags select. */
                                            className={cn(
                                                'border-border h-11 touch-pan-x overflow-hidden border-l transition-colors',
                                                !lastRow && 'border-b',
                                                /* Inside a booking, not at its end. */
                                                hold && !closesRun && !lastRow && 'border-b-transparent',
                                                active && 'bg-primary',
                                                !active && open && 'bg-surface hover:bg-primary-soft',
                                                hold && 'cursor-not-allowed',
                                                hold && (hold.is_yours ? 'bg-primary-soft' : 'bg-surface-muted'),
                                            )}
                                            style={hold && !hold.is_yours ? { backgroundImage: BOOKED_HATCH } : undefined}
                                        >
                                            {hold && opensRun && (
                                                <span className="flex h-full w-full flex-col justify-center overflow-hidden px-2 text-left">
                                                    {/* Who holds it is the point of the block, so it
                                                        is set at body metadata size rather than the
                                                        smaller size the gutter and the rate use. */}
                                                    <span
                                                        className={cn(
                                                            'truncate text-[0.75rem] leading-tight font-semibold',
                                                            hold.is_yours ? 'text-primary' : 'text-secondary',
                                                        )}
                                                    >
                                                        {hold.title}
                                                    </span>
                                                    {/* A single 30-minute block has no room for a
                                                        second line, and its row already says when. */}
                                                    {rows > 1 && hold.ends_at && (
                                                        <span data-numeric className="text-muted truncate text-[0.6875rem] leading-tight">
                                                            until {label12h(hold.ends_at)}
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="border-border text-meta text-muted flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t px-3 py-2">
                <span className="flex items-center gap-1.5">
                    <span className="border-border bg-surface size-3 rounded-sm border" /> Free
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="border-border bg-surface-muted size-3 rounded-sm border" style={{ backgroundImage: BOOKED_HATCH }} /> Taken —
                    named on the block
                </span>
                {mine && (
                    <span className="flex items-center gap-1.5">
                        <span className="bg-primary-soft border-border size-3 rounded-sm border" /> Yours
                    </span>
                )}
                <span className="flex items-center gap-1.5">
                    <span className="bg-primary size-3 rounded-sm" /> Selected
                </span>
                <span className="ml-auto">Drag down a column for a longer session, up to {MAX_HOURS} hours.</span>
            </div>
        </div>
    );
}
