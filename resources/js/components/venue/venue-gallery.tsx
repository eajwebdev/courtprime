import { cn } from '@/lib/utils';
import { useState } from 'react';

export type VenuePhoto = { id: number; url: string; caption?: string | null };

/** A club shows four, which is a gallery without becoming a scroll. */
const SLOTS = 4;

/**
 * Venue gallery.
 *
 * Four images: a hero with the other three beside it, so a listing shows the
 * place rather than naming it. Selection is local state and swaps the hero
 * without navigating, which keeps the directory scannable.
 *
 * A club with fewer than four gets the partner mark in the slots it has not
 * filled, held as a watermark on the deep ground rather than stretched to fill.
 * That asset is a one bit copy of the monogram and carries a lot of edge
 * speckle; blown up to a hero it reads as a damaged photograph, and small and
 * dimmed it reads as a placeholder, which is what it is.
 */
export function VenueGallery({ photos, name }: { photos: VenuePhoto[]; name: string }) {
    const [active, setActive] = useState(0);

    const real = photos.slice(0, SLOTS);
    const slots = Array.from({ length: SLOTS }, (_, index) => real[index] ?? null);

    const hero = slots[Math.min(active, SLOTS - 1)];

    return (
        <div className="flex gap-2">
            <figure className="bg-surface-deep relative min-w-0 flex-1 overflow-hidden rounded-lg">
                {hero ? (
                    <>
                        <img
                            src={hero.url}
                            alt={hero.caption ? `${name} — ${hero.caption}` : name}
                            loading="lazy"
                            decoding="async"
                            className="aspect-[16/9] size-full object-cover sm:aspect-[3/2]"
                        />
                        {hero.caption && (
                            <figcaption className="from-surface-deep/90 text-meta absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent px-3 pt-6 pb-2 text-white">
                                {hero.caption}
                            </figcaption>
                        )}
                    </>
                ) : (
                    <div className="flex aspect-[16/9] items-center justify-center sm:aspect-[3/2]">
                        <PartnerMark className="w-1/3 max-w-28" />
                        <span className="text-meta absolute inset-x-0 bottom-0 px-3 pb-2 text-center text-white/45">
                            {real.length > 0 ? 'More photos coming' : 'Photos coming soon'}
                        </span>
                    </div>
                )}
            </figure>

            <div className="flex w-14 shrink-0 flex-col gap-2 sm:w-16">
                {slots.map((photo, index) => (
                    <button
                        key={photo?.id ?? `empty-${index}`}
                        type="button"
                        onClick={() => setActive(index)}
                        aria-label={photo ? (photo.caption ?? `Photo ${index + 1}`) : `Photo ${index + 1}, not uploaded yet`}
                        aria-pressed={index === active}
                        className={cn(
                            'bg-surface-deep relative flex aspect-square items-center justify-center overflow-hidden rounded-md border-2 transition-colors',
                            index === active ? 'border-primary' : 'hover:border-border-strong border-transparent',
                        )}
                    >
                        {photo ? (
                            <img src={photo.url} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                        ) : (
                            <PartnerMark className="w-3/5" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

/**
 * The partner mark, dimmed.
 *
 * White artwork on transparent, so it needs the deep ground behind it and a low
 * opacity to sit as texture rather than shout.
 */
function PartnerMark({ className }: { className?: string }) {
    return (
        <img
            src="/partner.png"
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className={cn('object-contain opacity-25', className)}
        />
    );
}
