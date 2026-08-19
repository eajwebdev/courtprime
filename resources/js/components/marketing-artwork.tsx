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

/**
 * Stand-in portraits for a player who has uploaded none.
 *
 * Three per gender, faceless and brand-coloured on purpose: a stock photo of a
 * stranger would read as a claim about who is on court, and a blank silhouette
 * reads as a broken image. All six are transparent PNGs in the navy/pink
 * palette, so they composite on `bg-surface-deep` and nowhere light.
 *
 * Gender comes from the player's stated field only, never inferred from a name.
 * Anything unset or withheld uses the female set, matching `athleteFor`.
 */
const DEFAULT_PORTRAITS = {
    male: ['/male_pickleball_default_1.png', '/male_pickleball_default_2.png', '/male_pickleball_default_3.png'],
    female: ['/female_pickleball_default_1.png', '/female_pickleball_default_2.png', '/female_pickleball_default_3.png'],
} as const;

export function defaultPortraits(gender?: string | null): readonly string[] {
    switch (String(gender ?? '').toLowerCase()) {
        case 'male':
        case 'man':
            return DEFAULT_PORTRAITS.male;
        default:
            return DEFAULT_PORTRAITS.female;
    }
}

/**
 * Stand-in artwork for a doubles pair.
 *
 * A team that has uploaded nothing reads better as one pair than as two
 * near-identical singles silhouettes side by side, so a doubles side with no
 * photos of its own gets the team art for its composition instead.
 *
 * Composition is read from stated gender only. A pair counts as men's or
 * women's doubles only when *both* players have said so; anything else — a
 * genuine mix, or a player who has not filled it in — uses the mixed art. That
 * is the honest default: it asserts nothing about somebody who never told us,
 * where picking one of the single-gender pieces would.
 */
const DOUBLES_PORTRAITS = {
    male: ['/pickleball_doubles_male.png'],
    female: ['/pickleball_doubles_female.png'],
    mixed: ['/pickleball_doubles_mixed_1.png', '/pickleball_doubles_mixed_2.png'],
} as const;

export function doublesPortraits(genders: readonly (string | null | undefined)[]): readonly string[] {
    const stated = genders.map((gender) => {
        switch (String(gender ?? '').toLowerCase()) {
            case 'male':
            case 'man':
                return 'male';
            case 'female':
            case 'woman':
                return 'female';
            default:
                return null;
        }
    });

    if (stated.length > 0 && stated.every((gender) => gender === 'male')) {
        return DOUBLES_PORTRAITS.male;
    }

    if (stated.length > 0 && stated.every((gender) => gender === 'female')) {
        return DOUBLES_PORTRAITS.female;
    }

    return DOUBLES_PORTRAITS.mixed;
}

/**
 * A doubles pair, full body, for scoreboards and courtside screens.
 *
 * `object-contain` unlike the single portrait: these are standing figures in a
 * 4:5 frame, and covering a square crop would cut them off at the knees and the
 * shoulders. They carry no background, so they need a dark surface under them.
 */
export function TeamPortrait({
    src,
    className,
    alt,
    priority = false,
    decorative = true,
    width = 1122,
    height = 1402,
    sizes = '(max-width: 768px) 30vw, 260px',
    onError,
}: ArtworkProps & { src: string; onError?: () => void }) {
    return (
        <ArtworkImage
            src={src}
            alt={decorative ? '' : (alt ?? 'CourtPrime doubles pair')}
            width={width}
            height={height}
            sizes={sizes}
            priority={priority}
            onError={onError}
            className={cn('object-contain select-none', className)}
        />
    );
}

/**
 * The portraits to cycle for one player: their own uploads if they have any,
 * otherwise the CourtPrime defaults for their stated gender.
 */
export function portraitsFor(player: { photos?: string[] | null; gender?: string | null }): readonly string[] {
    return player.photos?.length ? player.photos : defaultPortraits(player.gender);
}

/**
 * One player's portrait, square, for scoreboards and courtside screens.
 *
 * Sized by the caller through `className`. `object-cover` rather than contain:
 * these are square frames inside a circle or a rounded tile, and a contained
 * image would float in a box of empty space.
 */
export function PlayerPortrait({
    src,
    className,
    alt,
    priority = false,
    decorative = true,
    width = 512,
    height = 512,
    sizes = '(max-width: 768px) 25vw, 220px',
    onError,
}: ArtworkProps & { src: string; onError?: () => void }) {
    return (
        <ArtworkImage
            src={src}
            alt={decorative ? '' : (alt ?? 'CourtPrime player')}
            width={width}
            height={height}
            sizes={sizes}
            priority={priority}
            onError={onError}
            className={cn('object-cover select-none', className)}
        />
    );
}

function ArtworkImage({ src, alt, className, priority, width, height, sizes, onError }: ArtworkProps & { src: string; onError?: () => void }) {
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
            onError={onError}
            className={className}
        />
    );
}
