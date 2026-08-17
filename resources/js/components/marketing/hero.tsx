import { AthleteArtwork } from '@/components/marketing-artwork';
import { Button } from '@/components/ui/button';
import { EASE } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useRef } from 'react';

/**
 * Four floating product surfaces around the athlete, no more. They read as
 * real CourtPrime UI, not decoration.
 */
const surfaces = [
    { id: 'CP-PLY-000001', label: 'CourtPrime ID', value: 'CP-PLY-000001', position: 'left-0 top-[14%]', delay: 0.5 },
    { id: 'rating', label: 'Global rating', value: '4.21', position: 'right-0 top-[6%]', delay: 0.62 },
    { id: 'clubs', label: 'Connected clubs', value: '4', position: 'left-[2%] bottom-[26%]', delay: 0.74 },
    { id: 'next', label: 'Next match', value: '7:30 PM', position: 'right-[2%] bottom-[12%]', delay: 0.86 },
] as const;

export function Hero() {
    const reduce = useReducedMotion();
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
    const athleteY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80]);

    const enter = (delay: number) =>
        reduce
            ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.01 } }
            : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay, ease: EASE } };

    return (
        <section ref={ref} className="bg-surface-deep text-surface-deep-foreground relative overflow-hidden">
            {/* Single restrained brand glow. The athlete artwork supplies the rest. */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                    background:
                        'radial-gradient(46rem 34rem at 78% 28%, color-mix(in srgb, var(--primary) 22%, transparent) 0%, transparent 62%), radial-gradient(38rem 30rem at 12% 82%, color-mix(in srgb, var(--brand-blue) 18%, transparent) 0%, transparent 60%)',
                }}
            />
            <NetworkLines />

            <div className="relative mx-auto grid w-full max-w-7xl items-center gap-8 px-4 pt-24 pb-12 sm:gap-10 sm:px-6 sm:pt-28 sm:pb-16 lg:min-h-svh lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8 lg:pt-24 lg:pb-24">
                <div className="max-w-2xl">
                    <motion.p {...enter(0.05)} className="text-eyebrow text-primary uppercase">
                        One player identity · Every connected court
                    </motion.p>

                    {/* Sized down hard at 360 - 430px, the token default (3rem) overflows
                        "Play everywhere." on the narrowest phones. */}
                    <motion.h1
                        {...enter(0.12)}
                        className="mt-4 text-[2.125rem] leading-[1.05] font-semibold tracking-tight text-white sm:mt-5 sm:text-[3.25rem] lg:text-[4.25rem]"
                    >
                        Register once.
                        <br />
                        <span className="text-primary">Play everywhere.</span>
                    </motion.h1>

                    <motion.p {...enter(0.2)} className="text-body mt-5 max-w-xl text-white/70 sm:mt-6 sm:text-lg">
                        CourtPrime gives players one verified record that follows them across every connected club, and gives club owners a private
                        operating system to run reservations, courts, payments and tournaments.
                    </motion.p>

                    {/* Full-width taps on phones, inline from sm up. */}
                    <motion.div {...enter(0.28)} className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row">
                        <Button asChild size="touch" className="w-full sm:w-auto">
                            <Link href="/find-courts">
                                Find your next court <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                        <Button asChild size="touch" variant="onDeep" className="w-full sm:w-auto">
                            <Link href="/request-demo">Bring your club to CourtPrime</Link>
                        </Button>
                    </motion.div>

                    <motion.p {...enter(0.36)} className="text-meta mt-6 flex items-start gap-2 text-white/50 sm:mt-7 sm:items-center">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 sm:mt-0" />
                        Shared player identity. Private business operations. Tenant-isolated by design.
                    </motion.p>
                </div>

                <motion.div style={{ y: athleteY }} className="relative mx-auto w-full max-w-lg lg:max-w-none">
                    <motion.div
                        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: reduce ? 0.01 : 0.8, ease: EASE, delay: 0.15 }}
                    >
                        <AthleteArtwork
                            asset="/cp-model5.png"
                            alt="Two CourtPrime players mid-rally"
                            priority
                            sizes="(max-width: 1024px) 88vw, 620px"
                            className="mx-auto h-auto w-full max-w-[34rem] drop-shadow-2xl"
                        />
                    </motion.div>

                    {surfaces.map((surface) => (
                        <motion.div
                            key={surface.id}
                            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.94 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: reduce ? 0.01 : 0.5, delay: reduce ? 0 : surface.delay, ease: EASE }}
                            className={cn(
                                'absolute hidden rounded-xl border border-white/12 bg-white/8 px-3.5 py-2.5 backdrop-blur-md sm:block',
                                surface.position,
                            )}
                        >
                            <p className="text-[0.6875rem] tracking-wider text-white/50 uppercase">{surface.label}</p>
                            <p data-numeric className="text-body mt-0.5 font-semibold text-white">
                                {surface.value}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* Mobile fallback for the floating surfaces, the same product data as
                a scannable strip, since absolute positioning has nowhere to go
                at phone widths. */}
            <div className="relative mx-auto w-full max-w-7xl px-4 pb-12 sm:hidden">
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10">
                    {surfaces.map((surface) => (
                        <div key={surface.id} className="bg-surface-deep p-3">
                            <p className="text-[0.6875rem] tracking-wider text-white/50 uppercase">{surface.label}</p>
                            <p data-numeric className="text-label mt-0.5 font-semibold text-white">
                                {surface.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/** Very subtle network geometry behind the hero. Draws once, then rests. */
function NetworkLines() {
    const reduce = useReducedMotion();

    return (
        <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full opacity-[0.18]"
            viewBox="0 0 1200 800"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
        >
            {['M120 620 L360 480 L640 540 L900 380', 'M80 300 L340 240 L620 320 L960 200', 'M360 480 L340 240', 'M640 540 L620 320'].map(
                (d, index) => (
                    <motion.path
                        key={d}
                        d={d}
                        stroke="var(--brand-blue)"
                        strokeWidth="1.5"
                        initial={reduce ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: reduce ? 0.01 : 1.6, delay: reduce ? 0 : 0.4 + index * 0.15, ease: 'easeInOut' }}
                    />
                ),
            )}
            {[
                [360, 480],
                [640, 540],
                [340, 240],
                [620, 320],
                [900, 380],
            ].map(([cx, cy]) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="var(--primary)" />
            ))}
        </svg>
    );
}
