import { AthleteArtwork, BrandWordmark, BrandWordmarkAuto } from '@/components/marketing-artwork';
import { MobileNavDrawer, type MobileNavLink } from '@/components/mobile-nav-drawer';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { type ReactNode } from 'react';

/**
 * Shared chrome for the public discovery pages (/find-courts, /find-open-play,
 * /find-tournaments). One header, one hero treatment, one footer, so the three
 * pages read as the same product rather than three separate templates.
 */

const navLinks: MobileNavLink[] = [
    { label: 'Courts', href: '/find-courts', description: 'Book a court at any connected club' },
    { label: 'Open play', href: '/find-open-play', description: 'Drop-in sessions near you' },
    { label: 'Tournaments', href: '/find-tournaments', description: 'Competitions taking entries' },
    { label: 'Rankings', href: '/leaderboards', description: 'Global and city standings' },
];

export function DiscoveryHeader({
    current,
    authenticated = false,
    isPlayer = false,
}: {
    current?: string;
    authenticated?: boolean;
    /** Player already has the bottom tab bar, so the drawer would duplicate it. */
    isPlayer?: boolean;
}) {
    return (
        <header className="z-nav border-border bg-background/95 sticky top-0 border-b backdrop-blur-md">
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-1">
                    {/* Slides in from the left rather than pushing the page down. */}
                    {!isPlayer && <MobileNavDrawer links={navLinks} current={current} authenticated={authenticated} />}
                    <Link href={isPlayer ? '/me' : '/'} aria-label="EAJ CourtPrime home">
                        <BrandWordmarkAuto height={34} priority className="h-8" />
                    </Link>
                </div>

                <nav aria-label="Discover" className="hidden items-center gap-1 lg:flex">
                    {navLinks.map((link) => {
                        const active = link.href === current;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'text-label rounded-md px-3 py-1.5 font-medium transition-colors',
                                    active ? 'bg-surface-muted text-foreground' : 'text-muted hover:text-foreground',
                                )}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <ThemeToggle />

                {authenticated ? (
                    <Button asChild size="sm" variant="outline">
                        <Link href={isPlayer ? '/me' : '/dashboard'}>{isPlayer ? 'My CourtPrime' : 'Dashboard'}</Link>
                    </Button>
                ) : (
                    <Button asChild size="sm">
                        <Link href="/login">Sign in</Link>
                    </Button>
                )}
            </div>
        </header>
    );
}

export function DiscoveryHero({
    eyebrow,
    title,
    description,
    artwork,
    artworkAlt,
    children,
}: {
    eyebrow: string;
    title: string;
    description: string;
    /** Athlete asset, sits on the navy ground where the matting fringe is invisible. */
    artwork?: string;
    artworkAlt?: string;
    children?: ReactNode;
}) {
    return (
        <section className="bg-surface-deep text-surface-deep-foreground relative overflow-hidden">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(34rem 24rem at 82% 30%, color-mix(in srgb, var(--primary) 20%, transparent) 0%, transparent 62%), radial-gradient(28rem 22rem at 6% 90%, color-mix(in srgb, var(--brand-blue) 16%, transparent) 0%, transparent 60%)',
                }}
            />
            {artwork && (
                <>
                    {/* Visible on phones too, anchored to the top-right so it sits
                        behind the heading rather than behind the search controls. */}
                    <AthleteArtwork
                        asset={artwork}
                        alt={artworkAlt}
                        decorative={!artworkAlt}
                        sizes="(max-width: 1024px) 42vw, 380px"
                        className="pointer-events-none absolute top-0 right-0 h-[62%] w-auto max-w-[42%] object-contain object-top opacity-45 lg:top-auto lg:-bottom-4 lg:h-[108%] lg:max-w-none lg:object-bottom lg:opacity-70"
                    />
                    <div
                        aria-hidden
                        className="from-surface-deep via-surface-deep/90 lg:via-surface-deep/70 pointer-events-none absolute inset-0 bg-gradient-to-r to-transparent"
                    />
                </>
            )}

            <div className="relative mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
                <div className="max-w-[62%] sm:max-w-2xl">
                    <p className="text-eyebrow text-primary uppercase">{eyebrow}</p>
                    <h1 className="mt-3 text-[1.75rem] leading-[1.1] font-semibold tracking-tight text-white sm:mt-4 sm:text-[2.25rem] lg:text-[2.75rem]">
                        {title}
                    </h1>
                    {/* Four lines of strapline in a 62%-wide column pushed the
                        first result a screen and a half down on a phone. */}
                    <p className="text-label mt-3 line-clamp-2 max-w-xl text-white/65 sm:mt-4 sm:line-clamp-none sm:text-base">{description}</p>
                </div>
                <div className="relative">{children}</div>
            </div>
        </section>
    );
}

/** The glass search bar that sits inside a DiscoveryHero. */
export function DiscoverySearchBar({ children, onSubmit }: { children: ReactNode; onSubmit: (event: React.FormEvent) => void }) {
    return (
        <form onSubmit={onSubmit} className="mt-5 rounded-2xl border border-white/12 bg-white/8 p-2 backdrop-blur-md sm:mt-8 sm:p-2.5">
            <div className="flex flex-col gap-2 sm:flex-row">{children}</div>
        </form>
    );
}

/** A labelled field inside the search bar. */
export function SearchField({
    icon: Icon,
    label,
    className,
    children,
    trailing,
}: {
    icon: React.ElementType;
    label: string;
    className?: string;
    children: ReactNode;
    trailing?: ReactNode;
}) {
    return (
        <div className={cn('bg-surface flex items-center gap-3 rounded-xl px-4 py-2.5', className)}>
            <Icon className="text-primary size-4 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
                <span className="text-muted block text-[0.6875rem] tracking-wider uppercase">{label}</span>
                {children}
            </div>
            {trailing}
        </div>
    );
}

/**
 * One horizontally scrollable line of filters.
 *
 * Wrapping chips cost three stacked rows at 360px and pushed the results below
 * the fold. A single scrolling row keeps the search composition compact.
 */
export function FilterRow({ children }: { children: ReactNode }) {
    return <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">{children}</div>;
}

/** Pill filter used under the search bar, on the navy ground. */
export function FilterChip({
    active,
    onClick,
    children,
    icon: Icon,
}: {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
    icon?: React.ElementType;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'text-meta inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 font-medium whitespace-nowrap transition-colors',
                active ? 'border-primary bg-primary text-primary-foreground' : 'border-white/15 text-white/70 hover:bg-white/10',
            )}
        >
            {Icon && <Icon className="size-3.5" aria-hidden />}
            {children}
        </button>
    );
}

export function DiscoveryFooter() {
    return (
        <footer className="border-border bg-surface-deep text-surface-deep-foreground border-t px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <BrandWordmark variant="onDark" height={30} className="h-7" />
                <p className="text-meta text-white/45">One player identity. Every connected court.</p>
            </div>
        </footer>
    );
}

/** Laravel paginator links, rendered as a real control. */
export function Pagination({
    links,
    meta,
}: {
    links?: { url: string | null; label: string; active: boolean }[];
    meta?: { from?: number; to?: number; total?: number };
}) {
    if (!links || links.length <= 3) return null;

    return (
        <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-between gap-4">
            {meta?.total !== undefined && (
                <p className="text-meta text-muted">
                    Showing <span data-numeric>{meta.from ?? 0}</span>-<span data-numeric>{meta.to ?? 0}</span> of{' '}
                    <span data-numeric>{meta.total}</span>
                </p>
            )}
            <div className="flex flex-wrap gap-1">
                {links.map((link, index) => (
                    <Link
                        key={`${link.label}-${index}`}
                        href={link.url ?? '#'}
                        aria-current={link.active ? 'page' : undefined}
                        aria-disabled={!link.url}
                        className={cn(
                            'text-label border-border inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 transition-colors',
                            link.active && 'border-primary bg-primary text-primary-foreground',
                            !link.active && link.url && 'bg-surface text-secondary hover:text-foreground',
                            !link.url && 'text-muted pointer-events-none opacity-50',
                        )}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </nav>
    );
}
