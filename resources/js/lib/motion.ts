import { useReducedMotion, type Transition, type Variants } from 'framer-motion';

/**
 * CourtPrime motion system.
 *
 * Nothing in the authenticated app exceeds 360ms. Cinematic timings are for
 * landing-page storytelling only. See the `courtprime-motion` skill.
 */

export const EASE = [0.16, 1, 0.3, 1] as const;

export const DURATION = {
    micro: 0.15,
    ui: 0.22,
    overlay: 0.3,
    reveal: 0.45,
    cinematic: 0.9,
} as const;

export const SPRING: Transition = { type: 'spring', stiffness: 260, damping: 30 };
export const SPRING_SOFT: Transition = { type: 'spring', stiffness: 160, damping: 24 };

export const transition = {
    micro: { duration: DURATION.micro, ease: EASE },
    ui: { duration: DURATION.ui, ease: EASE },
    overlay: { duration: DURATION.overlay, ease: EASE },
    reveal: { duration: DURATION.reveal, ease: EASE },
} satisfies Record<string, Transition>;

/** Standard viewport config, sections animate once, never on scroll-back. */
export const VIEWPORT = { once: true, margin: '-80px' } as const;

/**
 * Pure reveal props. Use inside `.map()` where a hook would be illegal, read
 * `useReducedMotion()` once at the top of the component and pass it in.
 */
export function revealProps(reduce: boolean | null, options: { y?: number; delay?: number; duration?: number } = {}) {
    const { y = 24, delay = 0, duration = DURATION.reveal } = options;

    if (reduce) {
        return {
            initial: { opacity: 0 },
            whileInView: { opacity: 1 },
            viewport: VIEWPORT,
            transition: { duration: 0.01, delay: 0 },
        };
    }

    return {
        initial: { opacity: 0, y },
        whileInView: { opacity: 1, y: 0 },
        viewport: VIEWPORT,
        transition: { duration, delay, ease: EASE },
    };
}

/**
 * Section / element reveal. Returns props ready to spread onto a motion element.
 * Collapses to a plain fade when the user prefers reduced motion.
 *
 * Never call this inside a loop, use `revealProps` there.
 */
export function useReveal(options: { y?: number; delay?: number; duration?: number } = {}) {
    return revealProps(useReducedMotion(), options);
}

/** Entrance variant for above-the-fold content that should not wait for scroll. */
export function useEnter(options: { y?: number; delay?: number; duration?: number } = {}) {
    const reduce = useReducedMotion();
    const { y = 20, delay = 0, duration = DURATION.reveal } = options;

    if (reduce) {
        return {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.01, delay: 0 },
        };
    }

    return {
        initial: { opacity: 0, y },
        animate: { opacity: 1, y: 0 },
        transition: { duration, delay, ease: EASE },
    };
}

/**
 * Parent/child stagger. Cap visible stagger at ~8 children, past that the tail
 * reads as broken rather than choreographed.
 */
export function useStagger(step = 0.05) {
    const reduce = useReducedMotion();

    const parent: Variants = {
        hidden: {},
        show: {
            transition: reduce ? { staggerChildren: 0 } : { delayChildren: 0.06, staggerChildren: step },
        },
    };

    const child: Variants = reduce
        ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.01 } } }
        : {
              hidden: { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0, transition: { duration: DURATION.reveal, ease: EASE } },
          };

    return { parent, child, viewport: VIEWPORT };
}

/** Draws an SVG path once when it enters the viewport. Network connection lines. */
export function usePathDraw(duration = 0.8) {
    const reduce = useReducedMotion();

    if (reduce) {
        return {
            initial: { opacity: 0, pathLength: 1 },
            whileInView: { opacity: 1, pathLength: 1 },
            viewport: VIEWPORT,
            transition: { duration: 0.01 },
        };
    }

    return {
        initial: { pathLength: 0, opacity: 0 },
        whileInView: { pathLength: 1, opacity: 1 },
        viewport: VIEWPORT,
        transition: { duration, ease: 'easeInOut' as const },
    };
}

/** Press feedback for tiles and cards. Transform only. */
export const pressable = {
    whileHover: { y: -2 },
    whileTap: { scale: 0.985 },
    transition: transition.micro,
};

/** True when the user has asked for reduced motion, for imperative branches. */
export { useReducedMotion };
