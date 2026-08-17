import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

type EmptyStateProps = {
    title: string;
    description?: string;
    icon?: LucideIcon;
    /** Brand artwork path, use a paddle asset, never an athlete. */
    artwork?: string;
    action?: ReactNode;
    className?: string;
};

export function EmptyState({ title, description, icon: Icon, artwork, action, className }: EmptyStateProps) {
    return (
        <div
            className={cn(
                'border-border-strong flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-12 text-center',
                className,
            )}
        >
            {artwork ? (
                <img src={artwork} alt="" width={96} height={96} loading="lazy" decoding="async" className="mb-4 size-24 object-contain opacity-70" />
            ) : (
                Icon && (
                    <span className="bg-surface-muted text-muted mb-3 flex size-11 items-center justify-center rounded-lg">
                        <Icon className="size-5" />
                    </span>
                )
            )}
            <p className="text-h3 text-foreground">{title}</p>
            {description && <p className="text-label text-secondary mt-1.5 max-w-md">{description}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
