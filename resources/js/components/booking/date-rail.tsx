import { DatePickerSheet } from '@/components/booking/date-picker-sheet';
import { localIsoDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { CalendarDays } from 'lucide-react';
import { useMemo, useState } from 'react';

/* 64px square clears the 44px minimum with room for the weekday and the day
   number to stack. */
const cellClass = 'flex size-16 shrink-0 snap-start flex-col items-center justify-center gap-0.5 rounded-xl border transition-colors';

const dayCell = (offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);

    return {
        value: localIsoDate(offset),
        weekday: offset === 0 ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short' }),
        day: date.getDate(),
    };
};

const labelFor = (value: string) => {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return { weekday: 'Date', day: '—' };

    return { weekday: date.toLocaleDateString(undefined, { weekday: 'short' }), day: date.getDate() };
};

/**
 * The one date control for the whole product.
 *
 * A week rail, not a month grid: court bookings cluster in the next few days, so
 * the common case has to be one tap. Anything further out goes to the calendar
 * sheet behind the trailing cell. `tone` is the only thing that changes between
 * the app surface and the navy discovery hero, so the two never drift apart.
 */
export function DateRail({
    value,
    onChange,
    tone = 'surface',
    days = 7,
    from = 0,
    clearable = false,
    className,
}: {
    value: string;
    onChange: (value: string) => void;
    tone?: 'surface' | 'deep';
    days?: number;
    /**
     * Day the rail starts on, as an offset from today. Booking passes 1: courts
     * are taken a day ahead, so offering today would be offering a day every
     * slot on it would refuse.
     */
    from?: number;
    /**
     * Whether "no date" is a legal state. Booking always has a day selected, so
     * it leaves this off; discovery pages where the date is one optional filter
     * turn it on, and pressing the selected day again clears back to any date.
     */
    clearable?: boolean;
    className?: string;
}) {
    const [calendarOpen, setCalendarOpen] = useState(false);
    const cells = useMemo(() => Array.from({ length: days }, (_, offset) => dayCell(offset + from)), [days, from]);

    /*
     * An empty value means no date is chosen, which is a real state on a page
     * where the date is an optional filter. Treating it as a custom date lit up
     * the trailing cell as selected and labelled it "Date —".
     */
    const chosen = Boolean(value);
    const custom = chosen && !cells.some((cell) => cell.value === value);
    const customLabel = labelFor(value);

    const idle =
        tone === 'deep'
            ? 'border-white/15 bg-white/5 text-white hover:border-white/35'
            : 'border-border bg-surface text-foreground hover:border-border-strong';
    const quiet = tone === 'deep' ? 'text-white/55' : 'text-muted';

    return (
        <>
            <div
                role="group"
                aria-label="Date"
                /* scroll-pl matches the page gutter: without it the first snap point
                   aligns to the scrollport and eats the padding. */
                className={cn(
                    'no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-2 overflow-x-auto px-4 sm:mx-0 sm:scroll-pl-0 sm:px-0',
                    className,
                )}
            >
                {cells.map((cell) => {
                    const active = value === cell.value;
                    return (
                        <button
                            key={cell.value}
                            type="button"
                            onClick={() => onChange(active && clearable ? '' : cell.value)}
                            aria-pressed={active}
                            className={cn(cellClass, active ? 'border-primary bg-primary text-primary-foreground' : idle)}
                        >
                            <span className={cn('text-[0.6875rem] font-semibold tracking-wide uppercase', !active && quiet)}>{cell.weekday}</span>
                            <span data-numeric className="text-label font-semibold">
                                {cell.day}
                            </span>
                        </button>
                    );
                })}

                {/* Same geometry as the rail so it reads as one control, and it
                    shows the chosen date once the player picks one. */}
                <button
                    type="button"
                    onClick={() => setCalendarOpen(true)}
                    aria-label="Choose another date"
                    className={cn(cellClass, custom ? 'border-primary bg-primary text-primary-foreground' : idle)}
                >
                    {custom ? (
                        <>
                            <span className="text-[0.6875rem] font-semibold tracking-wide uppercase">{customLabel.weekday}</span>
                            <span data-numeric className="text-label font-semibold">
                                {customLabel.day}
                            </span>
                        </>
                    ) : (
                        <>
                            <CalendarDays className={cn('size-4', quiet)} aria-hidden />
                            <span className={cn('text-[0.6875rem] font-semibold tracking-wide uppercase', quiet)}>More</span>
                        </>
                    )}
                </button>
            </div>

            {/* The calendar honours the same floor, or the rail would refuse
                today while the sheet behind it still offered it. */}
            <DatePickerSheet open={calendarOpen} onOpenChange={setCalendarOpen} value={value} onSelect={onChange} from={from} />
        </>
    );
}
