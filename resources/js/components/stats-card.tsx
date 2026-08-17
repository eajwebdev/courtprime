import { Stat } from '@/components/layout-primitives';
import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

type StatsCardProps = {
    label: string;
    value: ReactNode;
    detail?: string;
    icon?: LucideIcon;
};

/**
 * @deprecated Use `<MetricBand>` with `<Stat>` from `layout-primitives`.
 * A row of eight bordered KPI cards is the pattern this redesign removes; a
 * single divided band reads as one instrument panel instead of eight objects.
 *
 * Retained as a bordered single stat so existing pages keep rendering while
 * they are migrated.
 */
export function StatsCard({ label, value, detail, icon }: StatsCardProps) {
    return (
        <div className="border-border bg-surface rounded-lg border">
            <Stat label={label} value={value} detail={detail} icon={icon} />
        </div>
    );
}
