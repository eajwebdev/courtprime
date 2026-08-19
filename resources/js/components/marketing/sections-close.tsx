import { AthleteArtwork, BrandWordmark, EquipmentArtwork } from '@/components/marketing-artwork';
import { MarketingSection } from '@/components/marketing/marketing-section';
import { Button } from '@/components/ui/button';
import { currency } from '@/lib/format';
import { revealProps, useReveal } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

export type Plan = {
    id: number;
    name: string;
    description: string;
    monthly_price: string;
    court_limit?: number | null;
    branch_limit?: number | null;
    features: { id: number; label: string }[];
    /** Launch pricing lives in the plan's metadata JSON, see DatabaseSeeder. */
    metadata?: {
        promo_price?: number | string | null;
        promo_label?: string | null;
        promo_note?: string | null;
        tagline?: string | null;
        featured?: boolean | null;
    } | null;
};

/* ========================================================================== */
/* Pricing                                                                    */
/* ========================================================================== */

/** Every card shows the same number of rows so the columns match height. */
const FEATURE_ROWS = 5;

export function SectionPricing({ plans }: { plans: Plan[] }) {
    const reduce = useReducedMotion();

    if (plans.length === 0) {
        return null;
    }

    const hasPromo = plans.some((plan) => Number(plan.metadata?.promo_price ?? 0) > 0);

    return (
        <MarketingSection
            id="pricing"
            eyebrow="Pricing"
            title="Priced per club, not per headache."
            description="Start with a single court and grow into a multi-branch network without changing systems."
            align="center"
        >
            {hasPromo && (
                <motion.p
                    {...revealProps(reduce, { y: 12 })}
                    className="border-primary/25 bg-primary-soft text-label text-primary mx-auto -mt-2 mb-10 flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-center font-medium"
                >
                    <Sparkles className="size-4 shrink-0" aria-hidden />
                    Founding club offer. First 6 clubs keep this rate for 12 months.
                </motion.p>
            )}

            {/* items-stretch + h-full keeps all three columns the same height no
                matter how much copy a plan carries. */}
            <div className="mx-auto grid max-w-5xl items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan, index) => {
                    const featured = Boolean(plan.metadata?.featured) || (plans.length === 3 && index === 1);
                    const promo = Number(plan.metadata?.promo_price ?? 0);
                    const list = Number(plan.monthly_price ?? 0);
                    const showPromo = promo > 0 && promo < list;

                    const limits = [
                        `${plan.branch_limit ?? 'Unlimited'} ${plan.branch_limit === 1 ? 'branch' : 'branches'}`,
                        `${plan.court_limit ?? 'Unlimited'} courts`,
                    ];

                    /* Enterprise carries an "Unlimited Branches" feature that repeats the
                       branch_limit row, so dedupe case-insensitively before slicing. */
                    const seen = new Set<string>();
                    const rows = [...limits, ...plan.features.map((feature) => feature.label)]
                        .filter((label) => {
                            const key = label.toLowerCase().trim();
                            if (seen.has(key)) return false;
                            seen.add(key);
                            return true;
                        })
                        .slice(0, FEATURE_ROWS);

                    return (
                        <motion.article
                            key={plan.id}
                            {...revealProps(reduce, { delay: index * 0.07 })}
                            className={cn(
                                'relative flex h-full flex-col rounded-2xl border p-6 text-left sm:p-7',
                                featured ? 'border-primary bg-surface shadow-e2 lg:-my-2 lg:py-9' : 'border-border bg-surface',
                            )}
                        >
                            {featured && (
                                <span className="bg-primary text-primary-foreground text-meta absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 font-semibold whitespace-nowrap">
                                    Most chosen
                                </span>
                            )}

                            <h3 className="text-h2 text-foreground">{plan.name}</h3>
                            <p className="text-label text-secondary mt-1.5">{plan.metadata?.tagline ?? plan.description}</p>

                            {/* Every card renders the same three price rows, so the dividers
                                below line up without a min-height guess leaving dead space. */}
                            <div className="mt-6">
                                <p className="text-meta text-muted flex min-h-5 flex-wrap items-center gap-2">
                                    {showPromo ? (
                                        <>
                                            <span className="line-through">{currency(list)}</span>
                                            <span className="bg-success-soft text-success rounded-full px-2 py-0.5 font-semibold">
                                                Save {Math.round(((list - promo) / list) * 100)}%
                                            </span>
                                        </>
                                    ) : (
                                        hasPromo && <span>Standard rate</span>
                                    )}
                                </p>

                                <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
                                    <span
                                        data-numeric
                                        className="text-foreground text-[2.25rem] leading-none font-semibold tracking-tight sm:text-[2.5rem]"
                                    >
                                        {currency(showPromo ? promo : list)}
                                    </span>
                                    <span className="text-label text-muted">/ month</span>
                                </p>

                                <p className="text-meta text-muted mt-1.5 min-h-4">
                                    {showPromo ? plan.metadata?.promo_note : 'Billed monthly. Cancel anytime.'}
                                </p>
                            </div>

                            {/* flex-1 lets the list absorb the slack instead of `mt-auto` on the
                                button, which collapses to a zero gap in the tallest card and
                                leaves the CTA sitting on top of the last feature row. */}
                            <ul className="border-border mt-6 flex-1 space-y-2.5 border-t pt-6">
                                {rows.map((label) => (
                                    <li key={label} className="text-label text-secondary flex items-start gap-2.5">
                                        <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
                                        <span className="capitalize">{label}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button asChild variant={featured ? 'default' : 'outline'} size="touch" className="mt-7 w-full">
                                <Link href="/request-demo">{featured ? 'Claim founding rate' : 'Talk to us'}</Link>
                            </Button>
                        </motion.article>
                    );
                })}
            </div>

            <div className="mt-12 flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
                <EquipmentArtwork asset="/cp-paddle4.png" decorative width={160} height={160} sizes="96px" className="size-20 shrink-0 sm:size-24" />
                <p className="text-label text-secondary max-w-md text-center sm:text-left">
                    Every plan includes the player network, live scoring and unlimited player accounts.{' '}
                    <Link href="/request-demo" className="text-primary font-medium hover:underline">
                        Talk to us
                    </Link>{' '}
                    about annual billing.
                </p>
            </div>
        </MarketingSection>
    );
}

/* ========================================================================== */
/* SECTION 10, Final CTA                                                     */
/* ========================================================================== */

export function SectionFinalCta() {
    const reveal = useReveal();

    return (
        <section className="content-defer bg-surface-deep text-surface-deep-foreground relative overflow-hidden">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(40rem 30rem at 15% 20%, color-mix(in srgb, var(--primary) 20%, transparent) 0%, transparent 60%), radial-gradient(36rem 28rem at 85% 80%, color-mix(in srgb, var(--brand-blue) 16%, transparent) 0%, transparent 60%)',
                }}
            />

            <div className="relative mx-auto grid w-full max-w-7xl items-end gap-10 px-4 pt-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pt-28">
                <div className="pb-16 lg:pb-28">
                    <motion.h2
                        {...reveal}
                        className="max-w-xl text-[1.875rem] leading-[1.08] font-semibold tracking-tight text-white sm:text-[2.5rem] lg:text-[3rem]"
                    >
                        One player identity.
                        <br />
                        Every connected court.
                        <br />
                        <span className="text-primary">One premium pickleball ecosystem.</span>
                    </motion.h2>

                    <div className="mt-8 grid gap-6 sm:mt-10 sm:grid-cols-2">
                        <div>
                            <p className="text-eyebrow text-white/40 uppercase">For players</p>
                            <p className="text-body mt-2 text-white/65">Find courts, join open play, and carry one verified record everywhere.</p>
                            <Button asChild size="touch" className="mt-4 w-full sm:w-auto">
                                <Link href="/find-courts">
                                    Find your next court <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                        </div>
                        <div>
                            <p className="text-eyebrow text-white/40 uppercase">For clubs</p>
                            <p className="text-body mt-2 text-white/65">Run reservations, POS, memberships and tournaments in one place.</p>
                            <Button asChild size="touch" variant="onDeep" className="mt-4 w-full sm:w-auto">
                                <Link href="/request-demo">Bring your club to CourtPrime</Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="relative hidden lg:block">
                    <AthleteArtwork asset="/cp-model5.png" decorative sizes="480px" className="ml-auto h-auto w-full max-w-md" />
                </div>
            </div>
        </section>
    );
}

/* ========================================================================== */
/* Footer                                                                     */
/* ========================================================================== */

const footerGroups = [
    {
        title: 'Players',
        links: [
            ['Find courts', '/find-courts'],
            ['Open play', '/find-open-play'],
            ['Tournaments', '/find-tournaments'],
            ['Leaderboards', '/leaderboards'],
        ],
    },
    {
        title: 'Clubs',
        links: [
            ['Business OS', '#business'],
            ['Pricing', '#pricing'],
            ['Book a demo', '/request-demo'],
            ['Sign in', '/login'],
        ],
    },
    {
        title: 'Company',
        links: [
            ['Privacy policy', '/privacy-policy'],
            ['Terms of service', '/terms-of-service'],
            ['Contact', 'mailto:hello@eajwebdev.test'],
        ],
    },
] as const;

export function MarketingFooter() {
    return (
        <footer className="bg-surface-deep text-surface-deep-foreground border-t border-white/10">
            <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
                <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
                    <div>
                        {/* cp1.png, white ink, legal on this navy ground only. */}
                        <BrandWordmark variant="onDark" height={36} className="h-9" />
                        <p className="text-label mt-4 max-w-xs text-white/50">
                            One player identity. Every connected court. A product of EAJ Web Development Services.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                        {footerGroups.map((group) => (
                            <div key={group.title}>
                                <p className="text-eyebrow text-white/40 uppercase">{group.title}</p>
                                <ul className="mt-4 space-y-2.5">
                                    {group.links.map(([label, href]) => (
                                        <li key={label}>
                                            {href.startsWith('/') ? (
                                                <Link href={href} className="text-label text-white/65 transition-colors hover:text-white">
                                                    {label}
                                                </Link>
                                            ) : (
                                                <a href={href} className="text-label text-white/65 transition-colors hover:text-white">
                                                    {label}
                                                </a>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-12 border-t border-white/10 pt-6">
                    <p className="text-meta text-white/40">© {new Date().getFullYear()} EAJ Web Development Services. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
