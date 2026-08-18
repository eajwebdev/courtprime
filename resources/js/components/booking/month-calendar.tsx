import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type DayLoad = { bookings: number; revenue: number };

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function iso(date: Date) {
    /* Built from the local parts, not toISOString, which converts to UTC and
       hands back the previous day for anywhere ahead of it. */
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * A month, with how busy each day is.
 *
 * The number under each date is bookings taken, so the shape of the week is
 * readable at a glance: which evenings are full, which Tuesday is empty. That
 * is the question a calendar is for, and a paginated list could not answer it.
 */
export function MonthCalendar({
    month,
    selected,
    load,
    onSelect,
    onMonthChange,
    className,
}: {
    /** Any date inside the month being shown. */
    month: string;
    selected: string;
    load: Record<string, DayLoad>;
    onSelect: (date: string) => void;
    onMonthChange: (date: string) => void;
    className?: string;
}) {
    const cursor = new Date(`${month}T00:00:00`);
    const year = cursor.getFullYear();
    const monthIndex = cursor.getMonth();

    const first = new Date(year, monthIndex, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    /* getDay() is Sunday-first; the club week starts Monday. */
    const leading = (first.getDay() + 6) % 7;

    const cells: (Date | null)[] = [
        ...Array.from({ length: leading }, () => null),
        ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, monthIndex, index + 1)),
    ];

    while (cells.length % 7 !== 0) cells.push(null);

    const today = iso(new Date());
    const busiest = Math.max(1, ...Object.values(load).map((entry) => entry.bookings));

    const shift = (delta: number) => onMonthChange(iso(new Date(year, monthIndex + delta, 1)));

    return (
        <section className={cn('flex flex-col', className)}>
            <header className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-h3 text-foreground">{first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
                <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="iconSm" aria-label="Previous month" onClick={() => shift(-1)}>
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="iconSm" aria-label="Next month" onClick={() => shift(1)}>
                        <ChevronRight className="size-4" />
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((day) => (
                    <div key={day} className="text-meta text-muted pb-1 text-center font-medium">
                        {day}
                    </div>
                ))}

                {cells.map((date, index) => {
                    if (!date) return <div key={`pad-${index}`} />;

                    const value = iso(date);
                    const entry = load[value];
                    const isSelected = value === selected;
                    const isToday = value === today;

                    return (
                        <button
                            key={value}
                            type="button"
                            onClick={() => onSelect(value)}
                            aria-current={isSelected ? 'date' : undefined}
                            className={cn(
                                'flex aspect-square flex-col items-center justify-center rounded-lg border text-center transition-colors',
                                isSelected
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'hover:border-border-strong hover:bg-surface-muted border-transparent',
                            )}
                        >
                            <span
                                data-numeric
                                className={cn(
                                    'text-label leading-none font-medium',
                                    isSelected ? '' : isToday ? 'text-primary font-semibold' : 'text-foreground',
                                )}
                            >
                                {date.getDate()}
                            </span>

                            {/* A bar rather than a number: relative load reads
                                faster than a count you have to compare by eye. */}
                            <span
                                aria-hidden
                                className={cn('mt-1 h-1 rounded-full transition-all', isSelected ? 'bg-primary-foreground/70' : 'bg-primary')}
                                style={{
                                    width: entry ? `${Math.max(18, Math.round((entry.bookings / busiest) * 70))}%` : 0,
                                    opacity: entry ? 1 : 0,
                                }}
                            />
                            <span className="sr-only">
                                {entry ? `${entry.bookings} ${entry.bookings === 1 ? 'booking' : 'bookings'}` : 'no bookings'}
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
