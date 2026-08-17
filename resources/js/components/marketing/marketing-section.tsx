import { useReveal } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

type MarketingSectionProps = {
    id?: string;
    eyebrow?: string;
    title?: ReactNode;
    description?: ReactNode;
    children: ReactNode;
    /** `deep` = navy immersive band, `muted` = recessed light band. */
    tone?: 'default' | 'muted' | 'deep';
    align?: 'left' | 'center';
    className?: string;
    headerClassName?: string;
};

const tones = {
    default: 'bg-background text-foreground',
    muted: 'bg-surface-muted text-foreground',
    deep: 'bg-surface-deep text-surface-deep-foreground',
};

export function MarketingSection({
    id,
    eyebrow,
    title,
    description,
    children,
    tone = 'default',
    align = 'left',
    className,
    headerClassName,
}: MarketingSectionProps) {
    const reveal = useReveal();
    const reduce = useReducedMotion();
    const deep = tone === 'deep';

    /* Scoped to this section's ref, never a global scroll listener. */
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const headerY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [28, -28]);

    return (
        <section ref={ref} id={id} className={cn('content-defer py-14 sm:py-20 lg:py-28', tones[tone], className)}>
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                {(eyebrow || title || description) && (
                    /* Parallax lives on the outer element and the entrance reveal on the
                       inner one, sharing `y` between a scroll transform and an entrance
                       animation makes them fight. */
                    <motion.div style={{ y: headerY }} className={cn('max-w-3xl', align === 'center' && 'mx-auto', headerClassName)}>
                        <motion.div {...reveal} className={cn(align === 'center' && 'text-center')}>
                            {eyebrow && <p className="text-eyebrow text-primary uppercase">{eyebrow}</p>}
                            {title && (
                                <h2
                                    className={cn(
                                        'mt-3 text-[1.625rem] leading-[1.12] font-semibold tracking-tight sm:mt-4 sm:text-[2.25rem] lg:text-[2.75rem]',
                                        deep ? 'text-white' : 'text-foreground',
                                    )}
                                >
                                    {title}
                                </h2>
                            )}
                            {description && (
                                <p className={cn('text-body mt-5 sm:text-lg', deep ? 'text-white/65' : 'text-secondary')}>{description}</p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
                <div className={cn(eyebrow || title || description ? 'mt-8 sm:mt-12 lg:mt-16' : '')}>{children}</div>
            </div>
        </section>
    );
}
