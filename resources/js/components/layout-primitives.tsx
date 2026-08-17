import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';
import { type ElementType, type ReactNode } from 'react';

/**
 * The structural vocabulary that replaces "wrap everything in a Card".
 *
 * Rule: if removing the outer card does not reduce comprehension, remove it.
 * Use Section for grouping, Panel only when a surface genuinely needs to be
 * separated from the page, and Card (ui/card) only for individually
 * actionable objects.
 */

/* -------------------------------------------------------------------------- */
/* Container                                                                   */
/* -------------------------------------------------------------------------- */

type ContainerProps = {
    children: ReactNode;
    className?: string;
    /** `wide` for dashboards and tables, `prose` for reading-width content. */
    width?: 'default' | 'wide' | 'prose';
    as?: ElementType;
};

const widths = {
    default: 'max-w-7xl',
    wide: 'max-w-[96rem]',
    prose: 'max-w-3xl',
};

export function Container({ children, className, width = 'default', as: Tag = 'div' }: ContainerProps) {
    return <Tag className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', widths[width], className)}>{children}</Tag>;
}

/* -------------------------------------------------------------------------- */
/* Section, heading + content, no chrome                                      */
/* -------------------------------------------------------------------------- */

type SectionProps = {
    title?: string;
    description?: string;
    eyebrow?: string;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
    id?: string;
};

export function Section({ title, description, eyebrow, actions, children, className, id }: SectionProps) {
    return (
        <section id={id} className={cn('space-y-4', className)}>
            {(title || actions || eyebrow) && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                        {eyebrow && <p className="text-eyebrow text-primary uppercase">{eyebrow}</p>}
                        {title && <h2 className="text-h2 text-foreground">{title}</h2>}
                        {description && <p className="text-label text-secondary mt-1 max-w-2xl">{description}</p>}
                    </div>
                    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
                </div>
            )}
            {children}
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/* Panel, a bordered surface, used sparingly                                  */
/* -------------------------------------------------------------------------- */

export function Panel({ children, className, flush = false }: { children: ReactNode; className?: string; flush?: boolean }) {
    return <div className={cn('border-border bg-surface rounded-lg border', !flush && 'p-4 sm:p-5', className)}>{children}</div>;
}

/* -------------------------------------------------------------------------- */
/* MetricBand, ONE band of KPIs, divided. Not N cards.                        */
/* -------------------------------------------------------------------------- */

export function MetricBand({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'border-border bg-surface grid grid-cols-2 overflow-hidden rounded-lg border',
                'divide-border divide-x divide-y',
                'sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-5',
                className,
            )}
        >
            {children}
        </div>
    );
}

type StatProps = {
    label: string;
    value: ReactNode;
    detail?: string;
    trend?: { value: string; direction: 'up' | 'down' | 'flat' };
    icon?: LucideIcon;
    tone?: 'default' | 'primary';
};

export function Stat({ label, value, detail, trend, icon: Icon, tone = 'default' }: StatProps) {
    return (
        <div className="min-w-0 p-4 sm:p-5">
            <div className="flex items-center gap-2">
                {Icon && <Icon className={cn('size-4 shrink-0', tone === 'primary' ? 'text-primary' : 'text-muted')} />}
                <p className="text-meta text-muted truncate tracking-wide uppercase">{label}</p>
            </div>
            <p data-numeric className={cn('text-kpi mt-2', tone === 'primary' ? 'text-primary' : 'text-foreground')}>
                {value}
            </p>
            {(detail || trend) && (
                <p className="text-meta text-secondary mt-1 flex items-center gap-1.5">
                    {trend && (
                        <span
                            className={cn(
                                'font-medium',
                                trend.direction === 'up' && 'text-success',
                                trend.direction === 'down' && 'text-danger',
                                trend.direction === 'flat' && 'text-muted',
                            )}
                        >
                            {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '-'} {trend.value}
                        </span>
                    )}
                    {detail && <span className="truncate">{detail}</span>}
                </p>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* DataToolbar, sits above a table, on the page surface                       */
/* -------------------------------------------------------------------------- */

export function DataToolbar({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>;
}

export function ToolbarSpacer() {
    return <div className="ml-auto" />;
}

/* -------------------------------------------------------------------------- */
/* ChartFrame, a titled chart region without card chrome                      */
/* -------------------------------------------------------------------------- */

type ChartFrameProps = {
    title: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
    height?: number;
};

export function ChartFrame({ title, description, actions, children, className, height = 280 }: ChartFrameProps) {
    return (
        <div className={cn('border-border bg-surface rounded-lg border', className)}>
            <div className="border-border flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3 sm:px-5">
                <div className="min-w-0">
                    <h3 className="text-h3 text-foreground">{title}</h3>
                    {description && <p className="text-meta text-muted mt-0.5">{description}</p>}
                </div>
                {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </div>
            <div className="p-2 sm:p-4" style={{ minHeight: height }}>
                {children}
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* SplitLayout, content + sticky rail                                         */
/* -------------------------------------------------------------------------- */

export function SplitLayout({
    children,
    aside,
    className,
    asideWidth = 'md',
}: {
    children: ReactNode;
    aside: ReactNode;
    className?: string;
    asideWidth?: 'sm' | 'md' | 'lg';
}) {
    const cols = {
        sm: 'lg:grid-cols-[1fr_18rem]',
        md: 'lg:grid-cols-[1fr_22rem]',
        lg: 'lg:grid-cols-[1fr_26rem]',
    };

    return (
        <div className={cn('grid gap-6', cols[asideWidth], className)}>
            <div className="min-w-0">{children}</div>
            <aside className="lg:sticky lg:top-20 lg:self-start">{aside}</aside>
        </div>
    );
}
