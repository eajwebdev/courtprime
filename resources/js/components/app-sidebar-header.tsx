import { Breadcrumbs } from '@/components/breadcrumbs';
import { CommandMenu } from '@/components/global-search';
import { NotificationBell } from '@/components/notification-bell';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

/**
 * The context bar. Every authenticated shell carries the same five things:
 * a way back out (trigger), where you are (breadcrumbs), what scope you are in
 * (organisation / branch), the ⌘K command menu, and anything waiting on you.
 */
export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { workspace } = usePage<SharedData>().props;
    const current = workspace?.current;

    return (
        <header className="z-nav border-border bg-background/95 sticky top-0 flex h-16 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 md:px-6">
            <SidebarTrigger className="-ml-1 shrink-0" />

            <div className="min-w-0 flex-1">
                <Breadcrumbs breadcrumbs={breadcrumbs} />
                {current?.organization_name && (
                    <p className="text-meta text-muted truncate">
                        {current.organization_name}
                        {current.branch_name ? ` · ${current.branch_name}` : ''}
                        {current.role_label ? ` · ${current.role_label}` : ''}
                    </p>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
                <CommandMenu />
                {/* Every module in the app sits under this bar, so whatever is
                    waiting is reachable without navigating away from the screen
                    you are working on. */}
                <NotificationBell />
            </div>
        </header>
    );
}
