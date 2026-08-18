import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { localIsoDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

/* Sunday-first, matching the locale default for the markets CourtPrime runs in. */
const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const iso = (year: number, month: number, day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Currently selected date, `YYYY-MM-DD`. */
    value: string;
    onSelect: (value: string) => void;
    /** How far ahead clubs publish availability. */
    daysAhead?: number;
};

/**
 * An in-app month calendar.
 *
 * The native `<input type="date">` was doing this job invisibly, and on desktop
 * Chrome clicking a transparent date input does nothing at all — only its
 * calendar glyph opens the picker, and we had hidden it. This owns the
 * interaction instead of hoping the platform obliges.
 */
export function DatePickerSheet({ open, onOpenChange, value, onSelect, daysAhead = 120 }: Props) {
    const today = localIsoDate(0);
    const last = localIsoDate(daysAhead);

    const [cursor, setCursor] = useState(() => new Date(`${value}T00:00:00`));

    /* Reopening on a different date should land on that date's month. */
    useEffect(() => {
        if (open) setCursor(new Date(`${value}T00:00:00`));
    }, [open, value]);

    const grid = useMemo(() => {
        const year = cursor.getFullYear();
        const month = cursor.getMonth();
        const leading = new Date(year, month, 1).getDay();
        const days = new Date(year, month + 1, 0).getDate();

        return {
            year,
            month,
            label: cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
            cells: [...Array.from({ length: leading }, () => null), ...Array.from({ length: days }, (_, index) => index + 1)],
        };
    }, [cursor]);

    /* Guard rails so the arrows cannot walk out of the bookable window. */
    const canGoBack = iso(grid.year, grid.month, 1) > today;
    const canGoForward = iso(grid.year, grid.month, 28) < last;

    const step = (months: number) => setCursor(new Date(grid.year, grid.month + months, 1));

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            {/* hideClose: the primitive's corner X lands exactly on the next-month
                arrow. The grabber, the backdrop and Escape all dismiss this. */}
            <SheetContent
                hideClose
                side="bottom"
                className="bg-surface mx-auto max-w-md rounded-t-2xl p-0 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            >
                <SheetTitle className="sr-only">Choose a date</SheetTitle>
                <span aria-hidden className="bg-border mx-auto mt-2 mb-1 block h-1 w-9 rounded-full" />

                <div className="flex items-center justify-between gap-2 px-4 py-3">
                    <button
                        type="button"
                        onClick={() => step(-1)}
                        disabled={!canGoBack}
                        aria-label="Previous month"
                        className="text-secondary hover:bg-surface-muted flex size-11 items-center justify-center rounded-full transition-colors disabled:opacity-30"
                    >
                        <ChevronLeft className="size-5" />
                    </button>
                    <p className="text-h3 text-foreground">{grid.label}</p>
                    <button
                        type="button"
                        onClick={() => step(1)}
                        disabled={!canGoForward}
                        aria-label="Next month"
                        className="text-secondary hover:bg-surface-muted flex size-11 items-center justify-center rounded-full transition-colors disabled:opacity-30"
                    >
                        <ChevronRight className="size-5" />
                    </button>
                </div>

                <div className="grid grid-cols-7 px-3">
                    {WEEKDAY_INITIALS.map((initial, index) => (
                        <span key={index} className="text-muted py-1 text-center text-[0.6875rem] font-semibold tracking-wide uppercase">
                            {initial}
                        </span>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 px-3 pt-1 pb-4">
                    {grid.cells.map((day, index) => {
                        if (day === null) return <span key={`blank-${index}`} />;

                        const date = iso(grid.year, grid.month, day);
                        const disabled = date < today || date > last;
                        const selected = date === value;

                        return (
                            <button
                                key={date}
                                type="button"
                                disabled={disabled}
                                aria-pressed={selected}
                                aria-label={date}
                                onClick={() => {
                                    onSelect(date);
                                    onOpenChange(false);
                                }}
                                className={cn(
                                    'text-label relative flex aspect-square items-center justify-center rounded-lg font-medium transition-colors',
                                    selected && 'bg-primary text-primary-foreground',
                                    !selected && !disabled && 'text-foreground hover:bg-surface-muted',
                                    disabled && 'text-muted cursor-not-allowed opacity-40',
                                )}
                            >
                                <span data-numeric>{day}</span>
                                {/* Today keeps a marker even when another date is selected. */}
                                {date === today && !selected && <span aria-hidden className="bg-primary absolute bottom-1.5 size-1 rounded-full" />}
                            </button>
                        );
                    })}
                </div>
            </SheetContent>
        </Sheet>
    );
}
