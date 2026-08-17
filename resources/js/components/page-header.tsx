import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

type PageHeaderProps = {
    title: string;
    description?: string;
    eyebrow?: string;
    icon?: LucideIcon;
    actions?: ReactNode;
    className?: string;
};

export function PageHeader({ title, description, eyebrow, icon: Icon, actions, className }: PageHeaderProps) {
    return (
        <div className={cn('flex flex-col gap-3 md:flex-row md:items-start md:justify-between', className)}>
            <div className="min-w-0">
                {eyebrow && <p className="text-eyebrow text-primary mb-1 uppercase">{eyebrow}</p>}
                <div className="flex items-center gap-2.5">
                    {Icon && (
                        <span className="border-border bg-surface text-primary flex size-9 shrink-0 items-center justify-center rounded-lg border">
                            <Icon className="size-4" />
                        </span>
                    )}
                    <h1 className="text-h1 text-foreground truncate">{title}</h1>
                </div>
                {description && <p className="text-label text-secondary mt-2 max-w-3xl">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}
