import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';

/**
 * A hairline reading-progress bar pinned under the nav. Driven by a spring on a
 * motion value, so it never re-renders React on scroll.
 */
export function ScrollProgress() {
    const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 });

    if (reduce) return null;

    return (
        <motion.div
            aria-hidden
            style={{ scaleX }}
            className="z-nav from-primary to-brand-blue fixed inset-x-0 top-0 h-0.5 origin-left bg-gradient-to-r"
        />
    );
}
