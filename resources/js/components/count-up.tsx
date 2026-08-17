import { animate, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

type CountUpProps = {
    to: number;
    from?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    duration?: number;
    className?: string;
};

/**
 * Counts up once when scrolled into view. Uses `animate()` on a raw value and
 * writes through a single state update per frame budget, never a re-render
 * storm. Honours reduced motion by rendering the final value immediately.
 */
export function CountUp({ to, from = 0, decimals = 0, prefix = '', suffix = '', duration = 1.1, className }: CountUpProps) {
    const reduce = useReducedMotion();
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    const [value, setValue] = useState(reduce ? to : from);

    useEffect(() => {
        if (!inView || reduce) return;

        const controls = animate(from, to, {
            duration,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (latest) => setValue(latest),
        });

        return () => controls.stop();
    }, [inView, reduce, from, to, duration]);

    return (
        <span ref={ref} data-numeric className={className}>
            {prefix}
            {value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
            {suffix}
        </span>
    );
}
