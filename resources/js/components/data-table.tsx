import { EmptyState } from '@/components/empty-state';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

export type DataTableColumn<T> = {
    header: string;
    cell: (row: T) => ReactNode;
    className?: string;
    /** Right-aligns and applies tabular figures. */
    numeric?: boolean;
    /** Hidden below `sm`, use for secondary columns on mobile. */
    hideOnMobile?: boolean;
};

type DataTableProps<T> = {
    rows: T[];
    columns: DataTableColumn<T>[];
    rowKey: (row: T, index: number) => string | number;
    emptyTitle: string;
    emptyDescription?: string;
    emptyIcon?: LucideIcon;
    emptyArtwork?: string;
    emptyAction?: ReactNode;
    onRowClick?: (row: T) => void;
    /** Sticky header for long, scrolling tables. */
    stickyHeader?: boolean;
    className?: string;
};

/**
 * Tables live directly on the page surface, bounded by a border, never nested
 * inside a floating card. See the `courtprime-forms` skill.
 */
export function DataTable<T>({
    rows,
    columns,
    rowKey,
    emptyTitle,
    emptyDescription,
    emptyIcon,
    emptyArtwork,
    emptyAction,
    onRowClick,
    stickyHeader = false,
    className,
}: DataTableProps<T>) {
    if (rows.length === 0) {
        return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} artwork={emptyArtwork} action={emptyAction} />;
    }

    return (
        <div className={cn('border-border bg-surface overflow-hidden rounded-lg border', className)}>
            <div className="overflow-x-auto">
                <table className="text-label w-full">
                    <thead className={cn('bg-surface-muted text-left', stickyHeader && 'sticky top-0 z-10')}>
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.header}
                                    scope="col"
                                    className={cn(
                                        'text-meta text-muted px-4 py-2.5 font-semibold tracking-wide whitespace-nowrap uppercase',
                                        column.numeric && 'text-right tabular-nums',
                                        column.hideOnMobile && 'hidden sm:table-cell',
                                        column.className,
                                    )}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                        {rows.map((row, index) => (
                            <tr
                                key={rowKey(row, index)}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                                className={cn(
                                    'transition-colors duration-150',
                                    onRowClick && 'hover:bg-surface-muted focus-within:bg-surface-muted cursor-pointer',
                                    !onRowClick && 'hover:bg-surface-muted/60',
                                )}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.header}
                                        className={cn(
                                            'text-foreground px-4 py-3 align-middle',
                                            column.numeric && 'text-right tabular-nums',
                                            column.hideOnMobile && 'hidden sm:table-cell',
                                            column.className,
                                        )}
                                    >
                                        {column.cell(row)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
