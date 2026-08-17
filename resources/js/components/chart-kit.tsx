import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

/**
 * Shared Recharts furniture so every chart in CourtPrime reads as one system.
 *
 * Palette rules (see the `dataviz` skill):
 *   · categorical hues are assigned in fixed order and never cycled
 *   · ONE axis, never two y-scales. Two measures of different magnitude get
 *     two charts, not a second axis.
 *   · a single-series chart needs no legend; its title names the series
 */

export const CHART_SERIES = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'] as const;

export const axisTick = { fill: 'var(--muted-text)', fontSize: 11 };

export const gridProps = {
    stroke: 'var(--chart-grid)',
    strokeDasharray: '3 3',
    vertical: false,
} as const;

type TooltipEntry = { dataKey?: string | number; name?: string; value?: number; color?: string };

export type ChartTooltipProps = {
    active?: boolean;
    payload?: TooltipEntry[];
    label?: string | number;
    formatter?: (value: number) => string;
};

export function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
    if (!active || !payload?.length) return null;

    return (
        <div className="border-border bg-surface-raised shadow-e2 rounded-lg border px-3 py-2">
            <p className="text-meta text-muted font-medium">{label}</p>
            {payload.map((entry) => (
                <p key={String(entry.dataKey)} className="text-label text-foreground mt-1 flex items-center gap-2">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: entry.color }} aria-hidden />
                    <span className="text-secondary">{entry.name}</span>
                    <span data-numeric className="ml-auto font-semibold tabular-nums">
                        {formatter ? formatter(entry.value ?? 0) : (entry.value ?? 0).toLocaleString()}
                    </span>
                </p>
            ))}
        </div>
    );
}

/** A titled chart region. Not a Card, charts are not individually actionable. */
export function ChartPanel({
    title,
    description,
    headline,
    trend,
    actions,
    children,
    className,
}: {
    title: string;
    description?: string;
    headline?: ReactNode;
    trend?: { value: string; direction: 'up' | 'down' | 'flat' };
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={cn('border-border bg-surface flex flex-col overflow-hidden rounded-lg border', className)}>
            <div className="border-border flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3 sm:px-5">
                <div className="min-w-0">
                    <h3 className="text-h3 text-foreground">{title}</h3>
                    {description && <p className="text-meta text-muted mt-0.5">{description}</p>}
                </div>
                {headline && (
                    <p data-numeric className="text-h2 text-foreground">
                        {headline}
                        {trend && (
                            <span
                                className={cn(
                                    'text-label ml-2 font-medium',
                                    trend.direction === 'up' && 'text-success',
                                    trend.direction === 'down' && 'text-danger',
                                    trend.direction === 'flat' && 'text-muted',
                                )}
                            >
                                {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '-'} {trend.value}
                            </span>
                        )}
                    </p>
                )}
                {actions}
            </div>
            <div className="flex-1 p-2 sm:p-4">{children}</div>
        </section>
    );
}
