import { statusLabel, statusTone, type StatusTone } from '@/lib/format';
import { cn } from '@/lib/utils';

const toneClasses: Record<StatusTone, string> = {
    live: 'border-live/25 bg-live-soft text-live',
    available: 'border-available/25 bg-available-soft text-available',
    reserved: 'border-reserved/25 bg-reserved-soft text-reserved',
    maintenance: 'border-maintenance/25 bg-maintenance-soft text-maintenance',
    openPlay: 'border-open-play/25 bg-open-play-soft text-open-play',
    danger: 'border-danger/25 bg-danger-soft text-danger',
    neutral: 'border-border-strong bg-surface-muted text-secondary',
};

const dotClasses: Record<StatusTone, string> = {
    live: 'bg-live',
    available: 'bg-available',
    reserved: 'bg-reserved',
    maintenance: 'bg-maintenance',
    openPlay: 'bg-open-play',
    danger: 'bg-danger',
    neutral: 'bg-muted',
};

type StatusBadgeProps = {
    status: string;
    /** Override the rendered text; the tone still derives from `status`. */
    label?: string;
    className?: string;
};

/**
 * Status is never communicated by colour alone, every badge carries a text
 * label, and the live tone additionally animates its dot.
 */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
    const tone = statusTone(status);
    const text = label ?? statusLabel(status);
    const isLive = tone === 'live';

    return (
        <span
            className={cn(
                'text-meta inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium capitalize',
                toneClasses[tone],
                className,
            )}
        >
            <span className={cn('size-1.5 shrink-0 rounded-full', dotClasses[tone], isLive && 'motion-safe:animate-pulse')} aria-hidden />
            {text}
        </span>
    );
}

/** Standalone LIVE marker for scoreboards and immersive surfaces. */
export function LiveBadge({ className, children = 'Live' }: { className?: string; children?: React.ReactNode }) {
    return (
        <span
            className={cn(
                'border-live/40 bg-live/10 text-meta text-live inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-semibold tracking-wider uppercase',
                className,
            )}
        >
            <span className="relative flex size-2 shrink-0" aria-hidden>
                <span className="bg-live absolute inline-flex size-full rounded-full opacity-70 motion-safe:animate-ping" />
                <span className="bg-live relative inline-flex size-2 rounded-full" />
            </span>
            {children}
        </span>
    );
}
