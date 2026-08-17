import { EmptyState } from '@/components/empty-state';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any -- paginator payload from the controller. */
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Notifications', href: '/notifications' }];

export default function Notifications({ notifications, unreadCount }: { notifications: any; unreadCount: number }) {
    const rows: any[] = notifications?.data ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications | CourtPrime" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-h1 text-foreground">Notifications</h1>
                        <p className="text-label text-secondary mt-1.5">Alerts for your CourtPrime identity and current workspace.</p>
                    </div>
                    {unreadCount > 0 && <StatusBadge status="live" label={`${unreadCount} unread`} />}
                </div>

                {rows.length === 0 ? (
                    <EmptyState
                        title="You're all caught up"
                        description="Booking confirmations, match results and club announcements land here."
                        icon={Bell}
                    />
                ) : (
                    <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-xl border">
                        {rows.map((notification) => (
                            <NotificationRow key={notification.id} notification={notification} />
                        ))}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}

function NotificationRow({ notification }: { notification: any }) {
    const form = useForm({});
    const url = notification.data?.url;
    const unread = !notification.read_at;

    return (
        <li className={cn('flex gap-3 p-4', unread && 'bg-primary-soft/40')}>
            {/* Unread is a dot plus a weight change, never colour alone. */}
            <span aria-hidden className={cn('mt-1.5 size-2 shrink-0 rounded-full', unread ? 'bg-primary' : 'bg-transparent')} />

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className={cn('text-label text-foreground', unread ? 'font-semibold' : 'font-medium')}>{notification.title}</p>
                    <StatusBadge status={notification.category} />
                    {unread && <span className="sr-only">Unread</span>}
                </div>

                <p className="text-meta text-secondary mt-1">{notification.body}</p>

                {/* Actions stack full width on a phone so both stay tappable. */}
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    {url && (
                        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                            <Link href={url}>Open</Link>
                        </Button>
                    )}
                    {unread && (
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={form.processing}
                            onClick={() => form.post(`/notifications/${notification.id}/read`, { preserveScroll: true })}
                            className="w-full sm:w-auto"
                        >
                            <CheckCheck className="size-4" />
                            Mark read
                        </Button>
                    )}
                </div>
            </div>
        </li>
    );
}
