import { AthleteArtwork } from '@/components/marketing-artwork';
import { MarketingSection } from '@/components/marketing/marketing-section';
import { Button } from '@/components/ui/button';
import { EASE, revealProps, usePathDraw, useReveal, VIEWPORT } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion, useScroll } from 'framer-motion';
import { ArrowRight, Clock, Lock, MapPin, Plus, Search, Shield, Sun, Wind } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type NetworkClub = {
    name: string;
    city: string | null;
    slug: string | null;
    /** Venues this club runs. A club is the unit here, not the venue. */
    branches?: number;
    courts: number;
    rate: number | string | null;
};

/* ========================================================================== */
/* SECTION 1, One player identity                                            */
/* ========================================================================== */

/** Positions around the identity hub. Four keeps the diagram readable. */
const ORBIT_ANGLES = [-140, -50, 40, 130];

/**
 * Real connected locations, supplied by LandingController. When fewer clubs
 * exist than the diagram has slots, the remainder are neutral placeholders
 * rather than invented business names.
 */
function buildOrbit(clubs: NetworkClub[]) {
    return ORBIT_ANGLES.map((angle, index) => {
        const club = clubs[index];

        return {
            /* Two organizations can each run a branch called "Dumaguete
               Pickleball Hub", so the name alone is not a key. */
            key: `${club?.name ?? 'placeholder'}-${index}`,
            name: club?.name ?? `Connected club ${index + 1}`,
            city: club?.city ?? 'Joining the network',
            placeholder: !club,
            angle,
        };
    });
}

export function SectionIdentity({ clubs = [] }: { clubs?: NetworkClub[] }) {
    const reveal = useReveal();
    const draw = usePathDraw();
    const reduce = useReducedMotion();
    const orbit = buildOrbit(clubs);

    return (
        <MarketingSection
            id="identity"
            tone="deep"
            eyebrow="Section 01 · One player identity"
            title={
                <>
                    One profile. <span className="text-primary">Every connected court.</span>
                </>
            }
            description="Players register once with CourtPrime. That single verified identity connects to every participating club, so ratings, history and reservations never start over."
        >
            <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
                <motion.div {...reveal} className="order-2 lg:order-1">
                    <ul className="space-y-6">
                        {[
                            ['Register once', 'A CourtPrime ID is issued the first time a player joins any connected club.'],
                            ['Play everywhere', 'Walk into a different club in a different city and you are already known.'],
                            ['Keep one verified record', 'Ratings, matches and rankings accumulate against one identity, never fragmented.'],
                        ].map(([title, copy]) => (
                            <li key={title} className="border-primary/40 border-l-2 pl-5">
                                <h3 className="text-h3 text-white">{title}</h3>
                                <p className="text-label mt-1.5 text-white/60">{copy}</p>
                            </li>
                        ))}
                    </ul>
                    <Button asChild variant="onDeep" className="mt-8">
                        <Link href="/leaderboards">
                            See the player network <ArrowRight className="size-4" />
                        </Link>
                    </Button>
                </motion.div>

                <div className="relative order-1 mx-auto aspect-square w-full max-w-[22rem] sm:max-w-md lg:order-2 lg:max-w-xl">
                    <svg aria-hidden viewBox="0 0 400 400" className="absolute inset-0 size-full">
                        {orbit.map((club) => {
                            const radians = (club.angle * Math.PI) / 180;
                            const x = 200 + Math.cos(radians) * 150;
                            const y = 200 + Math.sin(radians) * 150;
                            return (
                                <motion.line
                                    key={club.key}
                                    x1="200"
                                    y1="200"
                                    x2={x}
                                    y2={y}
                                    stroke="var(--brand-blue)"
                                    strokeWidth="1.5"
                                    strokeDasharray="4 4"
                                    {...draw}
                                />
                            );
                        })}
                        <circle cx="200" cy="200" r="150" stroke="var(--brand-blue)" strokeWidth="1" strokeOpacity="0.15" fill="none" />
                    </svg>

                    {/* The single identity at the centre. */}
                    <motion.div
                        {...reveal}
                        className="bg-surface-deep/95 shadow-e3 absolute top-1/2 left-1/2 z-10 w-32 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/15 p-3 text-center backdrop-blur-md sm:w-40 sm:p-4 lg:w-44"
                    >
                        <AthleteArtwork
                            asset="/cp-model4.png"
                            alt="CourtPrime player"
                            width={200}
                            height={252}
                            sizes="120px"
                            className="mx-auto h-16 w-auto sm:h-20 lg:h-24"
                        />
                        <p data-numeric className="text-meta text-primary mt-2 font-semibold">
                            CP-PLY-000001
                        </p>
                        <p className="text-[0.6875rem] tracking-wider text-white/45 uppercase">Verified identity</p>
                    </motion.div>

                    {orbit.map((club, index) => {
                        const radians = (club.angle * Math.PI) / 180;
                        return (
                            <motion.div
                                key={club.key}
                                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={VIEWPORT}
                                transition={{ duration: reduce ? 0.01 : 0.45, delay: reduce ? 0 : 0.5 + index * 0.12, ease: EASE }}
                                className="absolute w-[7.5rem] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/12 bg-white/8 px-2.5 py-1.5 backdrop-blur-sm sm:w-32 sm:px-3 sm:py-2 lg:w-36"
                                style={{
                                    left: `${50 + Math.cos(radians) * 34}%`,
                                    top: `${50 + Math.sin(radians) * 34}%`,
                                }}
                            >
                                <p className={cn('text-meta truncate font-semibold', club.placeholder ? 'text-white/45' : 'text-white')}>
                                    {club.name}
                                </p>
                                <p className="text-[0.6875rem] text-white/50">{club.city}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </MarketingSection>
    );
}

/* ========================================================================== */
/* SECTION 2, Discover courts                                                */
/* ========================================================================== */

export function SectionDiscover() {
    const reduce = useReducedMotion();
    const reveal = revealProps(reduce);

    return (
        <MarketingSection
            id="discover"
            eyebrow="Section 02 · Discover"
            title="Find a court the way players actually search."
            description="Location, surface, availability, open play, tournaments and rates, surfaced as venues, not as database rows."
        >
            <motion.div {...reveal} className="border-border bg-surface shadow-e1 rounded-2xl border p-2 sm:p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="bg-surface-muted flex flex-1 items-center gap-3 rounded-xl px-4 py-3">
                        <MapPin className="text-primary size-4 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-muted text-[0.6875rem] tracking-wider uppercase">Where</p>
                            <p className="text-label text-foreground truncate font-medium">Bacolod City, Negros Occidental</p>
                        </div>
                    </div>
                    <div className="bg-surface-muted flex flex-1 items-center gap-3 rounded-xl px-4 py-3">
                        <Clock className="text-primary size-4 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-muted text-[0.6875rem] tracking-wider uppercase">When</p>
                            <p className="text-label text-foreground truncate font-medium">Today · 6:00 PM - 9:00 PM</p>
                        </div>
                    </div>
                    <Button asChild size="touch" className="sm:w-auto">
                        <Link href="/find-courts">
                            <Search className="size-4" /> Search courts
                        </Link>
                    </Button>
                </div>
            </motion.div>

            <div className="mt-4 flex flex-wrap gap-2">
                {[
                    ['Indoor', Sun],
                    ['Outdoor', Wind],
                    ['Open play', null],
                    ['Tournaments', null],
                    ['Available now', null],
                ].map(([label, Icon]) => (
                    <span
                        key={label as string}
                        className="border-border bg-surface text-meta text-secondary inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium"
                    >
                        {Icon ? <Icon className="size-3.5" /> : null}
                        {label as string}
                    </span>
                ))}
            </div>
        </MarketingSection>
    );
}

/* ========================================================================== */
/* Courts powered by CourtPrime                                              */
/* ========================================================================== */

/**
 * The real, connected venues — the one place on the landing page that names
 * live clubs and links straight into their availability.
 *
 * Anyone can open a venue and see what is free today; the booking itself is
 * behind sign-in, and the court rows on the destination page say so rather
 * than bouncing a visitor to a login form with no explanation.
 */
export function SectionPoweredCourts({ clubs = [] }: { clubs?: NetworkClub[] }) {
    const reduce = useReducedMotion();

    /*
     * A logo wall, not a directory. Discover already lists venues with rates and
     * availability; repeating that here made two sections do one job. This one
     * answers a different question — who is actually on the network — so it
     * shows badges, and every real club links through to its listing.
     *
     * partner.png was offered for the placeholders but it is a 1-bit threshold
     * copy of the monogram with heavy edge noise; eight of them would read as a
     * rendering fault. A quiet outline mark is the honest placeholder.
     */
    const placeholders = Array.from({ length: 8 }, (_, index) => index);

    return (
        <MarketingSection
            id="powered-courts"
            eyebrow="Courts powered by CourtPrime"
            title="The network is filling up."
            description="Clubs already running on CourtPrime, and the next wave joining. Open any live club to see today's availability."
            align="center"
        >
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {clubs.map((venue, index) => (
                    <motion.li key={`${venue.name}-${index}`} {...revealProps(reduce, { delay: Math.min(index, 6) * 0.04, y: 12 })}>
                        <Link
                            href={`/find-courts?search=${encodeURIComponent(venue.name)}`}
                            title={venue.name}
                            className="border-border bg-surface hover:border-border-strong group flex h-full flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition-colors sm:p-4"
                        >
                            {/* No club has uploaded a mark yet, so the monogram
                                stands in — same pattern as the player avatar. */}
                            <span className="bg-surface-deep text-primary flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold sm:size-12">
                                {venue.name
                                    .split(' ')
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .map((part) => part[0]?.toUpperCase() ?? '')
                                    .join('')}
                            </span>
                            <span className="text-meta text-foreground line-clamp-2 font-medium">{venue.name}</span>
                            <span data-numeric className="text-muted text-[0.6875rem]">
                                {venue.courts} {venue.courts === 1 ? 'court' : 'courts'}
                            </span>
                            <span className="text-primary flex items-center gap-0.5 text-[0.6875rem] font-medium">
                                Live
                                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                            </span>
                        </Link>
                    </motion.li>
                ))}

                {placeholders.map((index) => (
                    <motion.li key={`joining-${index}`} {...revealProps(reduce, { delay: Math.min(clubs.length + index, 8) * 0.04, y: 12 })}>
                        <div className="border-border bg-surface-muted/40 flex h-full flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center sm:p-4">
                            <span className="border-border-strong text-muted flex size-11 shrink-0 items-center justify-center rounded-full border border-dashed sm:size-12">
                                <Shield className="size-5" aria-hidden />
                            </span>
                            <span className="text-muted text-[0.6875rem] font-medium tracking-wide uppercase">Joining soon</span>
                        </div>
                    </motion.li>
                ))}

                {/* The one action in this section. */}
                {/* One tile wide so 3 live + 8 joining + this fills two clean rows of six
                    instead of leaving a hole and wrapping onto a third. */}
                <motion.li {...revealProps(reduce, { delay: 0.4, y: 12 })}>
                    <Link
                        href="/request-demo"
                        className="border-primary/40 bg-primary-soft hover:border-primary group flex h-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed p-3 text-center transition-colors sm:p-4"
                    >
                        <span className="border-primary/50 text-primary flex size-11 shrink-0 items-center justify-center rounded-full border border-dashed sm:size-12">
                            <Plus className="size-5" aria-hidden />
                        </span>
                        <span className="text-primary flex items-center gap-0.5 text-[0.6875rem] font-semibold">
                            Add your club
                            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </span>
                    </Link>
                </motion.li>
            </ul>

            <p className="text-meta text-muted mt-5 flex items-center justify-center gap-2">
                <Lock className="size-3.5 shrink-0" aria-hidden />
                Browsing is open to everyone. Signing in is only needed to confirm a booking.
            </p>
        </MarketingSection>
    );
}

/* ========================================================================== */
/* SECTION 3, Book from one account                                          */
/* ========================================================================== */

const bookingSteps = [
    { label: 'Find club', detail: 'Any connected club', meta: 'Search by club, branch or city' },
    { label: 'Choose branch', detail: 'Main Branch', meta: 'Open until 11:00 PM' },
    { label: 'Choose court', detail: 'Court 03', meta: 'Outdoor · Championship surface' },
    { label: 'Choose time', detail: '7:30 PM - 9:00 PM', meta: '90 minutes' },
    { label: 'Add players', detail: '4 players', meta: 'Invite by CourtPrime ID' },
    { label: 'Add rentals', detail: '2 paddles, 1 ball set', meta: '+ ₱180' },
    { label: 'Pay', detail: '₱750 total', meta: 'CourtPrime wallet' },
    { label: 'Confirmed', detail: 'Booking CP-RSV-4417', meta: 'Receipt sent' },
];

export function SectionBooking() {
    const ref = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start center', 'end center'] });
    const [active, setActive] = useState(0);

    useEffect(() => {
        if (reduce) return;
        return scrollYProgress.on('change', (value) => {
            const index = Math.min(bookingSteps.length - 1, Math.max(0, Math.floor(value * bookingSteps.length)));
            setActive(index);
        });
    }, [scrollYProgress, reduce]);

    const step = bookingSteps[active];

    return (
        <MarketingSection
            id="booking"
            tone="muted"
            eyebrow="Section 03 · Book from one account"
            title="Watch CourtPrime operate."
            description="The same account books any connected club. No second registration, no second wallet, no second identity."
        >
            <div ref={ref} className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
                <ol className="space-y-1">
                    {bookingSteps.map((item, index) => {
                        const isActive = index === active;
                        const isDone = index < active;
                        return (
                            <li key={item.label}>
                                <button
                                    type="button"
                                    onClick={() => setActive(index)}
                                    aria-current={isActive ? 'step' : undefined}
                                    className={cn(
                                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-200',
                                        isActive ? 'bg-surface shadow-e1' : 'hover:bg-surface/60',
                                    )}
                                >
                                    <span
                                        data-numeric
                                        className={cn(
                                            'flex size-6 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-semibold transition-colors',
                                            isActive && 'bg-primary text-primary-foreground',
                                            isDone && 'bg-success/15 text-success',
                                            /* The band is already surface-muted, so an unvisited step
                                               needs a ring rather than a fill to stay visible. */
                                            !isActive && !isDone && 'border-border-strong text-muted border',
                                        )}
                                    >
                                        {index + 1}
                                    </span>
                                    <span className={cn('text-label font-medium', isActive ? 'text-foreground' : 'text-muted')}>{item.label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ol>

                <div className="lg:sticky lg:top-24 lg:self-start">
                    <div className="border-border bg-surface-deep shadow-e2 relative overflow-hidden rounded-2xl border p-6">
                        <AthleteArtwork
                            asset="/cp-model1.png"
                            decorative
                            width={1136}
                            height={1434}
                            sizes="240px"
                            className="pointer-events-none absolute -right-10 -bottom-6 h-64 w-auto opacity-25"
                        />
                        <div className="relative">
                            <p className="text-eyebrow text-white/40 uppercase">
                                Step {active + 1} of {bookingSteps.length}
                            </p>
                            <motion.div
                                key={step.label}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, ease: EASE }}
                            >
                                <h3 className="text-h2 mt-3 text-white">{step.label}</h3>
                                <p className="text-primary mt-4 text-[1.75rem] leading-tight font-semibold tracking-tight">{step.detail}</p>
                                <p className="text-label mt-2 text-white/55">{step.meta}</p>
                            </motion.div>
                            <div className="mt-8 h-1 overflow-hidden rounded-full bg-white/10">
                                <motion.div
                                    className="bg-primary h-full rounded-full"
                                    animate={{ width: `${((active + 1) / bookingSteps.length) * 100}%` }}
                                    transition={{ duration: 0.3, ease: EASE }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MarketingSection>
    );
}

/* ========================================================================== */
/* SECTION 4, Your record follows you                                        */
/* ========================================================================== */

/** Illustrative results, attached to whichever clubs are actually connected. */
const RESULT_SHAPE = [
    { result: 'Won', score: '11 - 8', date: 'Aug 12', delta: '+0.06' },
    { result: 'Won', score: '11 - 6', date: 'Jul 28', delta: '+0.04' },
    { result: 'Lost', score: '9 - 11', date: 'Jul 14', delta: '-0.02' },
    { result: 'Won', score: '11 - 4', date: 'Jun 30', delta: '+0.07' },
] as const;

export function SectionRecord({ clubs = [] }: { clubs?: NetworkClub[] }) {
    const reduce = useReducedMotion();
    const reveal = revealProps(reduce);

    const history = RESULT_SHAPE.map((entry, index) => ({
        ...entry,
        org: clubs[index % Math.max(clubs.length, 1)]?.name ?? `Connected club ${index + 1}`,
    }));

    return (
        <MarketingSection
            id="record"
            eyebrow="Section 04 · Your record follows you"
            title="Four clubs. Four cities. One timeline."
            description="Matches played at different organisations flow into a single chronological player history, the record belongs to the player, not to any one club."
        >
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.75fr]">
                <div className="relative">
                    {/* The spine is the point, not the rows. */}
                    <div
                        aria-hidden
                        className="from-primary via-brand-blue absolute top-4 bottom-4 left-[7px] w-px bg-gradient-to-b to-transparent"
                    />
                    <ol className="space-y-7">
                        {history.map((match, index) => (
                            <motion.li
                                key={`${match.org}-${match.date}`}
                                {...revealProps(reduce, { delay: index * 0.08, y: 16 })}
                                className="relative pl-8"
                            >
                                <span
                                    aria-hidden
                                    className={cn(
                                        'border-background absolute top-1.5 left-0 size-[15px] rounded-full border-2',
                                        match.result === 'Won' ? 'bg-success' : 'bg-muted',
                                    )}
                                />
                                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                                    <p className="text-h3 text-foreground">{match.org}</p>
                                    <p className="text-meta text-muted">{match.date}</p>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <span className={cn('text-label font-semibold', match.result === 'Won' ? 'text-success' : 'text-secondary')}>
                                        {match.result}
                                    </span>
                                    <span data-numeric className="text-label text-secondary">
                                        {match.score}
                                    </span>
                                    <span
                                        data-numeric
                                        className={cn('text-meta font-medium', match.delta.startsWith('+') ? 'text-success' : 'text-danger')}
                                    >
                                        {match.delta} rating
                                    </span>
                                </div>
                            </motion.li>
                        ))}
                    </ol>
                </div>

                <motion.div {...reveal} className="relative mx-auto max-w-xs">
                    <AthleteArtwork
                        asset="/cp-model3.png"
                        alt="CourtPrime player"
                        backdrop
                        sizes="(max-width: 1024px) 60vw, 320px"
                        className="h-auto w-full"
                    />
                    <div className="border-border bg-surface shadow-e2 absolute inset-x-4 bottom-0 rounded-xl border p-4">
                        <p className="text-meta text-muted tracking-wider uppercase">Global rating</p>
                        <p data-numeric className="text-kpi text-foreground mt-1">
                            4.21
                        </p>
                        <p className="text-meta text-success mt-1">▲ 0.15 over 4 clubs</p>
                    </div>
                </motion.div>
            </div>
        </MarketingSection>
    );
}
