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
    className,
}: {
    value: string;
    onChange: (value: string) => void;
    tone?: 'surface' | 'deep';
    days?: number;
    className?: string;
}) {
    const [calendarOpen, setCalendarOpen] = useState(false);
    const cells = useMemo(() => Array.from({ length: days }, (_, offset) => dayCell(offset)), [days]);

    const custom = !cells.some((cell) => cell.value === value);
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
                            onClick={() => onChange(cell.value)}
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

            <DatePickerSheet open={calendarOpen} onOpenChange={setCalendarOpen} value={value} onSelect={onChange} />
        </>
    );
}
