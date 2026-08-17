import { BrandWordmark } from '@/components/marketing-artwork';
import { MobileNavDrawer, type MobileNavLink } from '@/components/mobile-nav-drawer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { useState } from 'react';

const links: MobileNavLink[] = [
    { label: 'Player Network', href: '#identity', description: 'One identity, every club' },
    { label: 'Discover Courts', href: '#discover', description: 'Search connected venues' },
    { label: 'Live', href: '#live', description: 'Matches happening now' },
    { label: 'Business OS', href: '#business', description: 'Run your club' },
    { label: 'Pricing', href: '#pricing', description: 'Founding club rates' },
];

const playerLinks: MobileNavLink[] = [
    { label: 'Find courts', href: '/find-courts' },
    { label: 'Open play', href: '/find-open-play' },
    { label: 'Tournaments', href: '/find-tournaments' },
    { label: 'Rankings', href: '/leaderboards' },
];

export function MarketingNav({ authenticated }: { authenticated: boolean }) {
    const { scrollY } = useScroll();
    const [solid, setSolid] = useState(false);

    useMotionValueEvent(scrollY, 'change', (value) => setSolid(value > 24));

    return (
        <motion.header
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                'z-nav fixed inset-x-0 top-0 transition-colors duration-300',
                solid ? 'bg-surface-deep/90 border-b border-white/10 backdrop-blur-md' : 'bg-transparent',
            )}
        >
            <nav aria-label="Primary" className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-1">
                    {/* Trigger sits first so the drawer opens from the edge it slides in from. */}
                    <MobileNavDrawer links={[...links, ...playerLinks]} authenticated={authenticated} />
                    <Link href="/" className="flex items-center rounded-sm" aria-label="EAJ CourtPrime home">
                        <BrandWordmark variant="onDark" height={36} priority className="h-8 sm:h-9" />
                    </Link>
                </div>

                <div className="hidden items-center gap-7 lg:flex">
                    {links.map((link) => (
                        <a key={link.href} href={link.href} className="text-label text-white/70 transition-colors hover:text-white">
                            {link.label}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={authenticated ? '/dashboard' : '/login'}
                        className="text-label hidden rounded-sm px-2 font-medium text-white/80 transition-colors hover:text-white sm:inline-flex"
                    >
                        {authenticated ? 'Dashboard' : 'Sign in'}
                    </Link>
                    <Button asChild size="sm" className="hidden sm:inline-flex">
                        <Link href="/request-demo">Book a demo</Link>
                    </Button>
                </div>
            </nav>
        </motion.header>
    );
}
