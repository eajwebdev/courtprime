import { Hero } from '@/components/marketing/hero';
import { MarketingNav } from '@/components/marketing/marketing-nav';
import { ScrollProgress } from '@/components/marketing/scroll-progress';
import { SectionNetworkStats, type NetworkStat } from '@/components/marketing/section-network-stats';
import { SectionBusinessOS, SectionBusinessTransition } from '@/components/marketing/sections-business';
import { MarketingFooter, SectionFinalCta, SectionPricing, type Plan } from '@/components/marketing/sections-close';
import { SectionLiveNetwork, SectionRankings } from '@/components/marketing/sections-network';
import {
    SectionBooking,
    SectionDiscover,
    SectionIdentity,
    SectionPoweredCourts,
    SectionRecord,
    type NetworkClub,
} from '@/components/marketing/sections-player';
import { type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { lazy, Suspense } from 'react';

/* Recharts is ~360 kB and the analytics section is far below the fold, so it
   loads on demand rather than blocking the hero. */
const SectionAnalytics = lazy(() => import('@/components/marketing/section-analytics').then((module) => ({ default: module.SectionAnalytics })));

/**
 * The landing page is a scroll story, not a hero + feature grid. Each section
 * is a separate component so this file stays a table of contents.
 */
export default function Welcome({
    plans = [],
    networkStats = [],
    networkClubs = [],
}: {
    plans: Plan[];
    networkStats?: NetworkStat[];
    networkClubs?: NetworkClub[];
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            {/* Title and description are printed server-side by
                App\Support\Seo so a crawler that runs no JavaScript still gets
                them; this keeps the tab title identical after hydration. */}
            <Head title="CourtPrime — Pickleball Club Software & Player Network">
                <link rel="preload" as="image" href="/cp-model5.png" fetchPriority="high" />
            </Head>

            <a
                href="#main"
                className="focus:z-toast focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:rounded-md focus:px-4 focus:py-2"
            >
                Skip to content
            </a>

            <ScrollProgress />
            <MarketingNav authenticated={Boolean(auth.user)} />

            <main id="main" className="bg-background text-foreground">
                <Hero />
                <SectionNetworkStats stats={networkStats} />

                {/* Player story */}
                <SectionIdentity clubs={networkClubs} />
                <SectionDiscover />
                <SectionPoweredCourts clubs={networkClubs} />
                <SectionBooking />
                <SectionRecord clubs={networkClubs} />
                <SectionLiveNetwork clubs={networkClubs} />
                <SectionRankings />

                {/* Business story */}
                <SectionBusinessTransition />
                <SectionBusinessOS />
                <Suspense fallback={<div className="h-[42rem]" aria-hidden />}>
                    <SectionAnalytics />
                </Suspense>

                <SectionPricing plans={plans} />
                <SectionFinalCta />
            </main>

            <MarketingFooter />
        </>
    );
}
