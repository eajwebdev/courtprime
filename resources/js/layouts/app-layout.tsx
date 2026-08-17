import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import PlayerShell from '@/layouts/app/player-shell';
import { shellForWorkspace } from '@/lib/navigation';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

interface AppLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    /** Force a shell regardless of role, used by POS and display screens. */
    shell?: 'auto' | 'workspace' | 'player';
    /** `wide` gives the player shell room for a desktop side rail. */
    width?: 'default' | 'wide';
}

/**
 * Persona shells share one design language but not one information
 * architecture. See the `courtprime-shells` skill.
 */
export default function AppLayout({ children, breadcrumbs, shell = 'auto', width = 'default', ...props }: AppLayoutProps) {
    const { workspace } = usePage<SharedData>().props;
    const kind = shell === 'auto' ? shellForWorkspace(workspace) : shell === 'player' ? 'player' : 'owner';

    if (kind === 'player') {
        return <PlayerShell width={width}>{children}</PlayerShell>;
    }

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs} {...props}>
            {children}
        </AppSidebarLayout>
    );
}
