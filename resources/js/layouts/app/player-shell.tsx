import { CommandMenu } from '@/components/global-search';
import { BrandWordmarkAuto } from '@/components/marketing-artwork';
import { PlayerBottomNav } from '@/components/player-bottom-nav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { playerBottomNav } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

/**
 * PlayerShell, a sports app, not an admin dashboard.
 *
 * Mobile: top identity bar + bottom tab navigation, no sidebar anywhere.
 * Desktop: a compact top rail over a centred column.
 */
export default function PlayerShell({ children, width = 'default' }: { children: React.ReactNode; width?: 'default' | 'wide' }) {
    const { auth } = usePage<SharedData>().props;
    const page = usePage();
    const getInitials = useInitials();

    return (
        <div className="bg-background text-foreground min-h-svh">
            <header className="z-nav border-border bg-background/95 sticky top-0 border-b backdrop-blur-md">
                <div className={cn('mx-auto flex h-14 w-full items-center justify-between gap-3 px-4', width === 'wide' ? 'max-w-6xl' : 'max-w-3xl')}>
                    <Link href="/me" aria-label="CourtPrime player home">
                        <BrandWordmarkAuto height={28} className="h-7" />
                    </Link>

                    {/* Desktop rail, mobile uses the bottom bar instead. */}
                    <nav aria-label="Player sections" className="hidden items-center gap-1 md:flex">
                        {playerBottomNav.map((item) => {
                            const active = page.url === item.url || (item.url !== '/me' && page.url.startsWith(item.url));
                            return (
                                <Link
                                    key={item.title}
                                    href={item.url}
                                    aria-current={active ? 'page' : undefined}
                                    className={cn(
                                        'text-label rounded-md px-3 py-1.5 font-medium transition-colors',
                                        active ? 'bg-surface-muted text-foreground' : 'text-muted hover:text-foreground',
                                    )}
                                >
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-2">
                        <CommandMenu />
                        <DropdownMenu>
                            <DropdownMenuTrigger className="focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:ring-offset-2">
                                <Avatar className="size-8">
                                    <AvatarImage src={auth.user?.avatar} alt={auth.user?.name} />
                                    <AvatarFallback className="bg-surface-muted text-meta">{getInitials(auth.user?.name ?? '')}</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Bottom padding clears the fixed tab bar on mobile. */}
            <main className={cn('mx-auto w-full px-4 pt-5 pb-28 md:pb-12', width === 'wide' ? 'max-w-6xl' : 'max-w-3xl')}>{children}</main>

            <PlayerBottomNav />
        </div>
    );
}
