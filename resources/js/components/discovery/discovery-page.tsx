import { DiscoveryFooter, DiscoveryHeader } from '@/components/discovery/discovery-chrome';
import { PlayerBottomNav } from '@/components/player-bottom-nav';
import { shellForWorkspace } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { type ReactNode } from 'react';

/**
 * Wrapper for the public discovery pages.
 *
 * These routes are reachable both by anonymous visitors and by signed-in
 * players (the "Discover" tab points here). A player must not lose their shell
 * when they tap it, so when the current user is a player the page keeps the
 * bottom tab bar and the header stops offering "Sign in".
 */
export function DiscoveryPage({ current, children }: { current: string; children: ReactNode }) {
    const { auth, workspace } = usePage<SharedData>().props;
    const isPlayer = Boolean(auth?.user) && shellForWorkspace(workspace) === 'player';

    return (
        <div className="bg-background min-h-svh">
            <DiscoveryHeader current={current} authenticated={Boolean(auth?.user)} isPlayer={isPlayer} />

            {/* Clear the fixed tab bar so the footer is never trapped underneath. */}
            <div className={cn(isPlayer && 'pb-24 md:pb-0')}>
                {children}
                <DiscoveryFooter />
            </div>

            {isPlayer && <PlayerBottomNav />}
        </div>
    );
}
