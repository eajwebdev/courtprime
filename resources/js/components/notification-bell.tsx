import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useState } from 'react';

type Recent = { id: number; category: string; title: string; body: string; url: string | null; created_at: string };

/**
 * Notifications, from wherever you are.
 *
 * The bell used to be a link to the notification centre, which meant leaving
 * whatever you were doing to find out whether anything needed you — and then
 * navigating back. The few unread ones open in place instead, and the full
 * centre is still one tap away for triage.
 *
 * The list is fetched when the bell is opened rather than shipped with every
 * page: this sits in the header of every screen in the app and most of them are
 * never opened.
 */
export function NotificationBell() {
    const page = usePage<SharedData>();
    const badges = (page.props.navBadges ?? {}) as Record<string, number>;

    /* The shared badge count is already on every page, so the dot is correct
       before anything is fetched. */
    const [unread, setUnread] = useState<number | null>(null);
    const [rows, setRows] = useState<Recent[] | null>(null);
    const [loading, setLoading] = useState(false);
    const markAll = useForm({});

    const count = unread ?? badges['/notifications'] ?? 0;

    const load = async () => {
        setLoading(true);

        try {
            const response = await fetch('/notifications/recent', { headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error(String(response.status));

            const data = await response.json();
            setRows(data.notifications ?? []);
            setUnread(data.unread ?? 0);
        } catch {
            /* Offline, or the session expired behind a long-open tab. The panel
               says so rather than spinning forever. */
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    const open = (row: Recent) => {
        router.post(`/notifications/${row.id}/read`, {}, { preserveScroll: true, preserveState: true });
        if (row.url) router.get(row.url);
    };

    return (
        <DropdownMenu onOpenChange={(next) => next && load()}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9"
                    aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
                >
                    <Bell className="!size-5 opacity-80" />
                    {count > 0 && (
                        <span
                            data-numeric
                            aria-hidden
                            className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[0.625rem] leading-4 font-semibold tabular-nums"
                        >
                            {count > 9 ? '9+' : count}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[22rem] p-0">
                <div className="border-border flex items-center justify-between gap-2 border-b px-3 py-2">
                    <p className="text-label text-foreground font-semibold">Notifications</p>
                    {count > 0 && (
                        <button
                            type="button"
                            disabled={markAll.processing}
                            onClick={() =>
                                markAll.post('/notifications/read-all', {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        setRows([]);
                                        setUnread(0);
                                    },
                                })
                            }
                            className="text-meta text-primary inline-flex items-center gap-1 font-medium hover:underline"
                        >
                            <CheckCheck className="size-3.5" />
                            Mark all read
                        </button>
                    )}
                </div>

                <div className="max-h-[22rem] overflow-y-auto">
                    {loading && rows === null && (
                        <p className="text-meta flex items-center justify-center gap-2 px-3 py-8">
                            <Loader2 className="size-4 animate-spin" aria-hidden />
                            Loading
                        </p>
                    )}

                    {rows?.length === 0 && <p className="text-meta px-3 py-8 text-center">Nothing waiting on you.</p>}

                    {rows?.map((row) => (
                        <button
                            key={row.id}
                            type="button"
                            onClick={() => open(row)}
                            className="hover:bg-surface-muted border-border flex w-full items-start gap-2.5 border-b px-3 py-2.5 text-left transition-colors last:border-b-0"
                        >
                            <span aria-hidden className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" />
                            <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-x-2">
                                    <span className="text-label text-foreground font-medium">{row.title}</span>
                                    <StatusBadge status={row.category} />
                                </span>
                                <span className="text-meta mt-0.5 block truncate">{row.body}</span>
                            </span>
                            <span className="text-meta shrink-0 whitespace-nowrap">{timeAgo(row.created_at)}</span>
                        </button>
                    ))}
                </div>

                <div className="border-border border-t p-2">
                    <Button variant="ghost" className={cn('w-full')} onClick={() => router.get('/notifications')}>
                        Open notification centre
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
