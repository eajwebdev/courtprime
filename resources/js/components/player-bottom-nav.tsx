import { playerBottomNav } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';

/**
 * Player navigation is a sports app, not an admin sidebar. Five destinations,
 * 44px+ targets, sitting in the thumb zone with a safe-area inset.
 */
export function PlayerBottomNav() {
    const page = usePage();

    return (
        <nav
            aria-label="Player navigation"
            className="z-sticky border-border bg-surface/95 fixed inset-x-0 bottom-0 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        >
            <ul className="grid grid-cols-5">
                {playerBottomNav.map((item) => {
                    const active = page.url === item.url || (item.url !== '/me' && page.url.startsWith(item.url));
                    const Icon = item.icon;

                    return (
                        <li key={item.title}>
                            <Link
                                href={item.url}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 transition-colors',
                                    active ? 'text-primary' : 'text-muted',
                                )}
                            >
                                {Icon && <Icon className="size-5" aria-hidden />}
                                <span className={cn('text-[0.6875rem] leading-none', active && 'font-semibold')}>{item.title}</span>
                                {/* Active state is never colour alone. */}
                                <span
                                    aria-hidden
                                    className={cn('h-0.5 w-6 rounded-full transition-colors', active ? 'bg-primary' : 'bg-transparent')}
                                />
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
