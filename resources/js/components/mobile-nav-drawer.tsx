import { BrandWordmark } from '@/components/marketing-artwork';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import { useState, type ReactNode } from 'react';

export type MobileNavLink = { label: string; href: string; description?: string };

/**
 * Left-hand slide-in navigation for phones.
 *
 * Menus that expand downward from the header push the page content and hide the
 * thing the user was looking at. A left drawer overlays instead, which is the
 * pattern people already expect on mobile.
 */
export function MobileNavDrawer({
    links,
    current,
    authenticated = false,
    footer,
}: {
    links: MobileNavLink[];
    current?: string;
    authenticated?: boolean;
    footer?: ReactNode;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button
                    type="button"
                    aria-label="Open menu"
                    className="text-foreground hover:bg-surface-muted flex size-10 items-center justify-center rounded-md transition-colors lg:hidden"
                >
                    <Menu className="size-5" />
                </button>
            </SheetTrigger>

            <SheetContent side="left" className="bg-surface-deep w-[19rem] border-white/10 p-0 text-white sm:w-[21rem]">
                <SheetTitle className="sr-only">Navigation</SheetTitle>

                <div className="flex h-full flex-col">
                    <div className="border-b border-white/10 px-5 py-5">
                        <Link href="/" onClick={() => setOpen(false)} aria-label="EAJ CourtPrime home">
                            <BrandWordmark variant="onDark" height={32} className="h-8" />
                        </Link>
                    </div>

                    <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-4">
                        <ul className="space-y-1">
                            {links.map((link) => {
                                const active = link.href === current;
                                return (
                                    <li key={link.href}>
                                        {link.href.startsWith('/') ? (
                                            <Link
                                                href={link.href}
                                                onClick={() => setOpen(false)}
                                                aria-current={active ? 'page' : undefined}
                                                className={cn(
                                                    'flex min-h-12 flex-col justify-center rounded-lg px-3 py-2.5 transition-colors',
                                                    active ? 'bg-primary/15 text-white' : 'text-white/75 hover:bg-white/5 hover:text-white',
                                                )}
                                            >
                                                <span className={cn('text-body', active && 'font-semibold')}>{link.label}</span>
                                                {link.description && <span className="text-meta mt-0.5 text-white/45">{link.description}</span>}
                                            </Link>
                                        ) : (
                                            <a
                                                href={link.href}
                                                onClick={() => setOpen(false)}
                                                className="text-body flex min-h-12 items-center rounded-lg px-3 py-2.5 text-white/75 transition-colors hover:bg-white/5 hover:text-white"
                                            >
                                                {link.label}
                                            </a>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    <div className="space-y-2 border-t border-white/10 px-4 py-4">
                        {footer}
                        <Button asChild size="touch" className="w-full">
                            <Link href="/request-demo" onClick={() => setOpen(false)}>
                                Book a demo
                            </Link>
                        </Button>
                        <Button asChild size="touch" variant="onDeep" className="w-full">
                            <Link href={authenticated ? '/dashboard' : '/login'} onClick={() => setOpen(false)}>
                                {authenticated ? 'Go to dashboard' : 'Sign in'}
                            </Link>
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
