import { CountUp } from '@/components/count-up';
import { revealProps } from '@/lib/motion';
import { motion, useReducedMotion } from 'framer-motion';

export type NetworkStat = { key: string; label: string; value: number; suffix?: string };

/**
 * Live network totals, counted from the database by LandingController.
 *
 * These are real figures, so the band has to survive a small network: stats at
 * zero are dropped, and the whole band hides rather than advertise an empty
 * platform. `+` is only appended once a number is large enough for the rounding
 * to actually mean "more than this".
 */
export function SectionNetworkStats({ stats = [] }: { stats?: NetworkStat[] }) {
    const reduce = useReducedMotion();
    const visible = stats.filter((stat) => stat.value > 0);

    if (visible.length === 0) {
        return null;
    }

    return (
        <section aria-label="Network at a glance" className="border-border bg-surface border-y">
            <div className="bg-border mx-auto grid w-full max-w-7xl grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-5">
                {visible.map((stat, index) => (
                    <motion.div
                        key={stat.key}
                        {...revealProps(reduce, { delay: index * 0.06, y: 14 })}
                        className="bg-surface px-4 py-7 text-center sm:px-5 sm:py-9"
                    >
                        <CountUp
                            to={stat.value}
                            suffix={stat.suffix ?? (stat.value >= 1000 ? '+' : '')}
                            className="text-foreground text-[1.75rem] leading-none font-semibold tracking-tight sm:text-[2.25rem]"
                        />
                        <p className="text-meta text-muted mt-2 tracking-wide uppercase">{stat.label}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
