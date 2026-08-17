import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

/**
 * Every CourtPrime brand image routes through this file. See the
 * `courtprime-brand-assets` skill for the placement rules.
 *
 * Assets are never regenerated, recoloured, stretched, or cropped through a
 * face. Always object-contain, always with intrinsic dimensions set.
 */

type ArtworkProps = {
    className?: string;
    alt?: string;
    priority?: boolean;
    decorative?: boolean;
    width?: number;
    height?: number;
    sizes?: string;
};

/**
 * The variant names the BACKGROUND the lockup sits on, not the ink colour.
 *
 * cp1.png, white "Court" → legal on dark only
 * cp2.png, navy  "Court" → legal on light only
 * cp3.png, damaged duplicate of cp1, deliberately unused
 */
type WordmarkVariant = 'onDark' | 'onLight';

const wordmarks: Record<WordmarkVariant, string> = {
    onDark: '/cp1.png',
    onLight: '/cp2.png',
};

const WORDMARK_RATIO = 2172 / 724; // 3:1

export function BrandWordmark({
    variant = 'onDark',
    className,
    alt = 'EAJ CourtPrime',
    priority = false,
    height = 40,
}: ArtworkProps & { variant?: WordmarkVariant }) {
    return (
        <ArtworkImage
            src={wordmarks[variant]}
            alt={alt}
            width={Math.round(height * WORDMARK_RATIO)}
            height={height}
            priority={priority}
            className={cn('w-auto object-contain', className)}
        />
    );
}

/**
 * Renders the correct lockup for whichever theme is active. Use on surfaces
 * that flip between light and dark; prefer the explicit variant when the
 * background is fixed (a navy band stays navy in light mode).
 */
export function BrandWordmarkAuto({ className, height = 40, priority = false, alt = 'EAJ CourtPrime' }: ArtworkProps & { height?: number }) {
    return (
        <>
            <BrandWordmark variant="onLight" height={height} priority={priority} alt={alt} className={cn('dark:hidden', className)} />
            <BrandWordmark variant="onDark" height={height} priority={priority} alt={alt} className={cn('hidden dark:block', className)} />
        </>
    );
}

/** The CP monogram. Never render below 24px, the bevel turns to mud. */
export function BrandIcon({ className, alt = 'CourtPrime', priority = false, size = 32 }: ArtworkProps & { size?: number }) {
    return <ArtworkImage src="/cp.png" alt={alt} width={size} height={size} priority={priority} className={cn('object-contain', className)} />;
}

/**
 * Athlete cut-outs carry faint matting fringe around the hair that is invisible
 * on navy and obvious on white, `backdrop` adds the radial navy ground that
 * hides it. See courtprime-brand-assets.
 */
export function AthleteArtwork({
    asset,
    className,
    alt,
    priority = false,
    decorative = false,
    backdrop = false,
    width = 1136,
    height = 1434,
    sizes = '(max-width: 1024px) 70vw, 560px',
}: ArtworkProps & { asset: string; backdrop?: boolean }) {
    return (
        <ArtworkImage
            src={asset}
            alt={decorative ? '' : (alt ?? 'CourtPrime athlete')}
            width={width}
            height={height}
            sizes={sizes}
            priority={priority}
            className={cn('object-contain select-none', backdrop && 'athlete-backdrop', className)}
        />
    );
}

export function EquipmentArtwork({
    asset,
    className,
    alt,
    priority = false,
    decorative = false,
    width = 1242,
    height = 1242,
    sizes = '(max-width: 768px) 40vw, 320px',
}: ArtworkProps & { asset: string }) {
    return (
        <ArtworkImage
            src={asset}
            alt={decorative ? '' : (alt ?? 'CourtPrime equipment')}
            width={width}
            height={height}
            sizes={sizes}
            priority={priority}
            className={cn('object-contain select-none', className)}
        />
    );
}

/** The LIVE motif, pink ball with a comet trail. Decorative, always aria-hidden. */
export function FloatingSportAccent({ asset = '/cp-paddle3.png', className, priority = false }: ArtworkProps & { asset?: string }) {
    return (
        <ArtworkImage
            src={asset}
            alt=""
            width={300}
            height={300}
            priority={priority}
            className={cn('pointer-events-none object-contain select-none', className)}
        />
    );
}

/** A glass data surface for floating product UI over dark marketing sections. */
export function MarketingVisualFrame({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <div className={cn('shadow-e3 relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.07] backdrop-blur-md', className)}>
            {children}
        </div>
    );
}

function ArtworkImage({ src, alt, className, priority, width, height, sizes }: ArtworkProps & { src: string }) {
    return (
        <img
            src={src}
            alt={alt ?? ''}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'low'}
            decoding={priority ? 'sync' : 'async'}
            width={width}
            height={height}
            sizes={sizes}
            aria-hidden={alt === '' ? true : undefined}
            className={className}
        />
    );
}
