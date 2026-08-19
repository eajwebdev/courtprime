import { EmptyState } from '@/components/empty-state';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';
import { useMemo } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- paginator payload from the controller. */
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Notifications', href: '/notifications' }];

type Category = { category: string; total: number; unread: number };

type Props = {
    notifications: any;
    filter: 'unread' | 'all';
    category: string | null;
    unreadCount: number;
    categories: Category[];
};

const label = (value: string) => value.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());

/**
 * The notification centre.
 *
 * A queue of things not yet dealt with, so it opens on unread and everything
 * else is one tap away. Rows are grouped by day and kept to a single line of
 * body text: an owner checking in between games is scanning for what needs
 * them, not reading correspondence.
 */
export default function Notifications({ notifications, filter, category, unreadCount, categories }: Props) {
    /* Memoised so the day grouping below is not rebuilt on every render by a
       fresh array literal. */
    const rows: any[] = useMemo(() => notifications?.data ?? [], [notifications]);
    const markAll = useForm({});

    const go = (next: { filter?: string; category?: string | null }) =>
        router.get(
            '/notifications',
            { filter: next.filter ?? filter, category: next.category === undefined ? category : (next.category ?? undefined) },
            { preserveState: true, preserveScroll: true },
        );

    /* Grouped by day, so a week of alerts reads as a few dated blocks rather
       than as sixty undifferentiated rows. */
    const days = useMemo(() => {
        const map = new Map<string, any[]>();

        for (const row of rows) {
            const key = new Date(row.created_at).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
            map.set(key, [...(map.get(key) ?? []), row]);
        }

        return [...map.entries()];
    }, [rows]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications | CourtPrime" />

            <div className="flex flex-col gap-5 p-4 md:p-6">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-h1 text-foreground">Notifications</h1>
                        <p className="text-meta mt-1">
                            {unreadCount > 0 ? (
                                <>
                                    <span data-numeric className="text-foreground font-semibold">
                                        {unreadCount}
                                    </span>{' '}
                                    unread across this workspace
                                </>
                            ) : (
                                'Nothing waiting on you.'
                            )}
                        </p>
                    </div>

                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            disabled={markAll.processing}
                            onClick={() =>
                                markAll.post(`/notifications/read-all${category ? `?category=${encodeURIComponent(category)}` : ''}`, {
                                    preserveScroll: true,
                                })
                            }
                        >
                            <CheckCheck className="size-4" />
                            Mark all read
                        </Button>
                    )}
                </header>

                {/* Unread / All, then the kinds that actually exist. Two rows of
                    controls, no dropdowns: every filter is visible and one tap. */}
                <div className="flex flex-col gap-2">
                    <div role="group" aria-label="Show" className="bg-surface-muted grid max-w-xs grid-cols-2 gap-1 rounded-xl p-1">
                        {(['unread', 'all'] as const).map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => go({ filter: value })}
                                aria-pressed={filter === value}
                                className={cn(
                                    'text-label min-h-9 rounded-lg font-medium transition-colors',
                                    filter === value ? 'bg-surface text-foreground shadow-e1' : 'text-secondary hover:text-foreground',
                                )}
                            >
                                {value === 'unread' ? 'Unread' : 'All'}
                            </button>
                        ))}
                    </div>

                    {categories.length > 1 && (
                        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
                            <FilterChip active={!category} onClick={() => go({ category: null })}>
                                Everything
                            </FilterChip>
                            {categories.map((entry) => (
                                <FilterChip
                                    key={entry.category}
                                    active={category === entry.category}
                                    onClick={() => go({ category: entry.category })}
                                >
                                    {label(entry.category)}
                                    <span data-numeric className="text-muted ml-1.5 font-normal">
                                        {filter === 'unread' ? entry.unread : entry.total}
                                    </span>
                                </FilterChip>
                            ))}
                        </div>
                    )}
                </div>

                {rows.length === 0 ? (
                    <EmptyState
                        title={filter === 'unread' ? "You're all caught up" : 'Nothing here yet'}
                        description={
                            filter === 'unread'
                                ? 'Cancellations, refunds, maintenance and support replies land here.'
                                : 'Notifications appear as things happen at your club.'
                        }
                        icon={Bell}
                        action={
                            filter === 'unread' ? (
                                <Button variant="outline" onClick={() => go({ filter: 'all' })}>
                                    Show everything
                                </Button>
                            ) : undefined
                        }
                    />
                ) : (
                    <div className="flex flex-col gap-5">
                        {days.map(([day, entries]) => (
                            <section key={day}>
                                <h2 className="text-meta mb-2 font-semibold tracking-wide uppercase">{day}</h2>

                                <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-xl border">
                                    {entries.map((notification) => (
                                        <NotificationRow key={notification.id} notification={notification} />
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                )}

                {notifications?.next_page_url && (
                    <Button variant="outline" className="self-center" onClick={() => router.get(notifications.next_page_url)}>
                        Load older
                    </Button>
                )}
            </div>
        </AppLayout>
    );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'text-label inline-flex min-h-9 shrink-0 items-center rounded-full border px-3.5 font-medium transition-colors',
                active ? 'border-primary bg-primary-soft text-primary' : 'border-border text-secondary hover:border-border-strong',
            )}
        >
            {children}
        </button>
    );
}

/**
 * One row, one line.
 *
 * The whole thing is the link when there is somewhere to go, so acting on a
 * notification is a single tap anywhere on it rather than hunting for a button.
 * Marking read happens on the way through.
 */
function NotificationRow({ notification }: { notification: any }) {
    const form = useForm({});
    const url = notification.data?.url;
    const unread = !notification.read_at;

    const open = () => {
        if (unread) form.post(`/notifications/${notification.id}/read`, { preserveScroll: true, preserveState: true });
        if (url) router.get(url);
    };

    return (
        <li className={cn('relative', unread && 'bg-primary-soft/30')}>
            <button
                type="button"
                onClick={open}
                className="hover:bg-surface-muted/60 flex w-full items-start gap-3 px-4 py-3 text-left transition-colors"
            >
                {/* Unread is a dot plus a weight change, never colour alone. */}
                <span aria-hidden className={cn('mt-2 size-2 shrink-0 rounded-full', unread ? 'bg-primary' : 'bg-transparent')} />

                <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={cn('text-label text-foreground', unread ? 'font-semibold' : 'font-medium')}>{notification.title}</span>
                        <StatusBadge status={notification.category} />
                        {unread && <span className="sr-only">Unread</span>}
                    </span>

                    <span className="text-meta mt-0.5 block truncate">{notification.body}</span>
                </span>

                <span className="text-meta shrink-0 whitespace-nowrap">{timeAgo(notification.created_at)}</span>
            </button>
        </li>
    );
}
