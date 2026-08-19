import { StatusBadge } from '@/components/status-badge';
import { currency, time12h } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useEffect, useRef } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payload from SchedulerController. */

export type SchedulerCourt = {
    id: number;
    name: string;
    court_number: number;
    status: string;
    branch: { id: number | null; name: string | null; code: string | null };
};

export type SchedulerReservation = {
    id: number;
    court_id: number;
    reference: string;
    start_time: string;
    end_time: string;
    player: string | null;
    mobile_number: string | null;
    players_count: number;
    booking_status: string;
    payment_status: string;
    amount_due: number;
    reservation_type: string;
};

export type SchedulerBlock = { id: number; court_id: number; start_time: string; end_time: string; reason: string };

/* Hatching, so a closed court is not conveyed by colour alone. */
const BLOCK_HATCH =
    'repeating-linear-gradient(45deg, transparent, transparent 5px, color-mix(in srgb, var(--border-strong) 55%, transparent) 5px, color-mix(in srgb, var(--border-strong) 55%, transparent) 6px)';

const COURT_CLOSED = ['maintenance', 'closed', 'inactive'];

const hourOf = (time: string) => Number(time.slice(0, 2));

type Cell =
    | { kind: 'free' }
    | { kind: 'closed'; label: string; start: boolean; end: boolean }
    | { kind: 'block'; block: SchedulerBlock; start: boolean; end: boolean; span: number }
    | { kind: 'booking'; reservation: SchedulerReservation; start: boolean; end: boolean; span: number };

/**
 * What sits on each court at each hour.
 *
 * Resolved once for the whole board rather than searched per cell: the previous
 * version ran a `find` over every reservation inside every one of the ~200
 * cells, and matched only on the starting hour, so the later hours of a long
 * booking came back empty and were drawn as blocked.
 */
function buildGrid(
    courts: SchedulerCourt[],
    reservations: SchedulerReservation[],
    blocks: SchedulerBlock[],
    hours: number[],
): Map<number, Map<number, Cell>> {
    const grid = new Map<number, Map<number, Cell>>();

    for (const court of courts) {
        const column = new Map<number, Cell>();
        const shut = COURT_CLOSED.includes(court.status);

        for (const hour of hours) {
            column.set(
                hour,
                shut
                    ? { kind: 'closed', label: court.status.replaceAll('_', ' '), start: hour === hours[0], end: hour === hours[hours.length - 1] }
                    : { kind: 'free' },
            );
        }

        if (!shut) {
            for (const block of blocks.filter((entry) => entry.court_id === court.id)) {
                const from = hourOf(block.start_time);
                const to = Math.max(from + 1, hourOf(block.end_time));

                for (let hour = from; hour < to; hour++) {
                    if (!column.has(hour)) continue;
                    column.set(hour, { kind: 'block', block, start: hour === from, end: hour === to - 1, span: to - from });
                }
            }

            /* Bookings last, so a court booked over a block still reads as sold
               — the money is the thing the desk has to honour. */
            for (const reservation of reservations.filter((entry) => entry.court_id === court.id)) {
                const from = hourOf(reservation.start_time);
                const to = Math.max(from + 1, hourOf(reservation.end_time));

                for (let hour = from; hour < to; hour++) {
                    if (!column.has(hour)) continue;
                    column.set(hour, { kind: 'booking', reservation, start: hour === from, end: hour === to - 1, span: to - from });
                }
            }
        }

        grid.set(court.id, column);
    }

    return grid;
}

/**
 * The day board.
 *
 * Hours down the side, courts across the top, both sticky so the labels stay
 * put while the middle scrolls. A free hour is a button that opens the booking
 * form already carrying the court, the date and the time; a booked one opens
 * that booking. Nothing on this board is decoration — every cell does something.
 */
export function SchedulerBoard({
    courts,
    reservations,
    blocks,
    hours,
    onBook,
    onOpen,
}: {
    courts: SchedulerCourt[];
    reservations: SchedulerReservation[];
    blocks: SchedulerBlock[];
    hours: number[];
    onBook: (court: SchedulerCourt, hour: number) => void;
    onOpen: (reservation: SchedulerReservation) => void;
}) {
    const grid = buildGrid(courts, reservations, blocks, hours);
    const columns = `4.5rem repeat(${courts.length}, minmax(9rem, 1fr))`;
    const scroller = useRef<HTMLDivElement>(null);

    /*
     * Open where the day actually is.
     *
     * The board starts at six in the morning and a pickleball club's day happens
     * in the evening, so it opened on four empty hours every time and the first
     * thing anybody did was scroll. It lands on the first booking instead, or on
     * the current hour when there is nothing booked yet.
     */
    useEffect(() => {
        const element = scroller.current;
        if (!element) return;

        const earliest = reservations.reduce<number | null>(
            (found, entry) => (found === null ? hourOf(entry.start_time) : Math.min(found, hourOf(entry.start_time))),
            null,
        );

        const target = earliest ?? new Date().getHours();
        const index = hours.indexOf(Math.max(hours[0], Math.min(target, hours[hours.length - 1])));

        if (index > 0) element.scrollTop = index * 56;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reservations, hours[0], hours.length]);

    /*
     * The scroller is taken out of flow on purpose.
     *
     * A grid this wide sets a min-content width, and min-width:auto on the flex
     * items above it carried that all the way up to the app shell: the whole
     * page scrolled sideways instead of the board scrolling inside its frame,
     * and `min-w-0` on the chain was not enough to stop it. Positioned
     * absolutely it cannot influence any ancestor's width at all, so the board
     * is exactly as wide as the space it is given and scrolls within it.
     */
    return (
        <div className="border-border bg-surface relative h-full w-full overflow-hidden rounded-xl border">
            {/* One scroll container for both axes, so the sticky header and the
                sticky time column stay locked to the cells they label. */}
            <div ref={scroller} className="absolute inset-0 overflow-auto">
                <div className="min-w-max">
                    <div className="bg-surface-muted z-sticky sticky top-0 grid" style={{ gridTemplateColumns: columns }}>
                        <span className="bg-surface-muted border-border z-sticky sticky left-0 border-r border-b" />
                        {courts.map((court) => (
                            <div key={court.id} className="border-border truncate border-b border-l px-3 py-2">
                                <p className="text-label text-foreground truncate font-semibold">{court.name}</p>
                                <p className="text-meta truncate">{court.branch.name}</p>
                            </div>
                        ))}
                    </div>

                    {hours.map((hour, index) => {
                        const last = index === hours.length - 1;

                        return (
                            <div key={hour} className="grid" style={{ gridTemplateColumns: columns }}>
                                <span
                                    className={cn(
                                        'bg-surface border-border text-meta z-nav sticky left-0 flex h-14 items-start justify-end border-r pt-1.5 pr-2 font-medium',
                                        !last && 'border-b',
                                    )}
                                >
                                    <span data-numeric>{time12h(`${String(hour).padStart(2, '0')}:00`)}</span>
                                </span>

                                {courts.map((court) => {
                                    const cell = grid.get(court.id)?.get(hour) ?? { kind: 'free' as const };

                                    return (
                                        <SchedulerCell
                                            key={court.id}
                                            cell={cell}
                                            hour={hour}
                                            last={last}
                                            onBook={() => onBook(court, hour)}
                                            onOpen={onOpen}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function SchedulerCell({
    cell,
    hour,
    last,
    onBook,
    onOpen,
}: {
    cell: Cell;
    hour: number;
    last: boolean;
    onBook: () => void;
    onOpen: (reservation: SchedulerReservation) => void;
}) {
    /* The rule between cells belongs to the cell, not the row, so the hours of
       one booking can drop it and read as a single block. `border-b-transparent`
       rather than no border, so every cell keeps the same height. */
    const edge = cn('border-border h-14 border-l', !last && 'border-b');
    const joined = cell.kind !== 'free' && !cell.end && !last ? 'border-b-transparent' : '';

    if (cell.kind === 'free') {
        return (
            <button
                type="button"
                onClick={onBook}
                aria-label={`Book ${time12h(`${String(hour).padStart(2, '0')}:00`)}`}
                className={cn(edge, 'group hover:bg-primary-soft flex items-center justify-center transition-colors')}
            >
                <Plus className="text-primary size-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
            </button>
        );
    }

    if (cell.kind === 'closed' || cell.kind === 'block') {
        const label = cell.kind === 'closed' ? cell.label : cell.block.reason.replaceAll('_', ' ');

        return (
            <div aria-label={label} className={cn(edge, joined, 'bg-surface-muted px-2')} style={{ backgroundImage: BLOCK_HATCH }}>
                {cell.start && <p className="text-meta truncate pt-1.5 font-semibold capitalize">{label}</p>}
            </div>
        );
    }

    const { reservation, start, span } = cell;
    const unpaid = reservation.payment_status !== 'paid';

    return (
        <button
            type="button"
            onClick={() => onOpen(reservation)}
            aria-label={`${reservation.player ?? 'Walk-in'}, ${time12h(reservation.start_time)} to ${time12h(reservation.end_time)}`}
            className={cn(edge, joined, 'bg-primary-soft hover:bg-primary-soft/70 relative px-2 text-left transition-colors')}
        >
            {/*
             * The label is laid over the whole booking, not squeezed into its
             * first hour. A cell is 3.5rem tall and a name, a time range and a
             * status do not fit in one — they were being clipped in half. This
             * spans every hour the booking covers, so a long booking gets the
             * room it already occupies on screen.
             */}
            {start && (
                <span
                    className="pointer-events-none absolute inset-x-2 top-0 z-10 flex flex-col justify-center gap-0.5 overflow-hidden py-1.5"
                    style={{ height: `calc(${span} * 3.5rem)` }}
                >
                    <span className="text-label text-foreground truncate font-semibold">{reservation.player ?? 'Walk-in'}</span>
                    <span data-numeric className="text-meta truncate">
                        {time12h(reservation.start_time)} – {time12h(reservation.end_time)}
                    </span>
                    {span > 1 && (
                        <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            <StatusBadge status={reservation.booking_status} />
                            <span data-numeric className={cn('text-meta font-medium', unpaid ? 'text-warning' : 'text-success')}>
                                {currency(reservation.amount_due)}
                            </span>
                        </span>
                    )}
                </span>
            )}
        </button>
    );
}
