import { defaultVenueArt } from '@/lib/athlete';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export type VenuePhoto = { id: number; url: string; caption?: string | null };

/**
 * Venue gallery.
 *
 * A hero image with a strip of thumbnails beside it, so a listing shows the
 * place rather than just naming it. Selection is local state and swaps the hero
 * without navigating, which keeps the directory scannable.
 *
 * A club with no photos gets CourtPrime's own doubles artwork rather than a
 * broken image icon. It is plainly illustration, not a photograph, so it fills
 * the space without pretending to be a venue nobody has photographed, and the
 * caption still says the photos are coming.
 */
export function VenueGallery({ photos, name }: { photos: VenuePhoto[]; name: string }) {
    const [active, setActive] = useState(0);

    if (photos.length === 0) {
        return (
            <div className="bg-surface-deep relative flex aspect-[16/9] items-end justify-center overflow-hidden rounded-lg sm:aspect-[3/2]">
                {/* The figures are portrait and the frame is landscape, so they
                    are sized on height and allowed to run past the sides. A
                    contained fit left them postage stamp sized in the middle. */}
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(20rem 14rem at 50% 85%, color-mix(in srgb, var(--primary) 24%, transparent) 0%, transparent 70%)',
                    }}
                />
                <img
                    src={defaultVenueArt(name)}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    decoding="async"
                    className="relative h-[112%] w-auto max-w-none object-contain object-bottom"
                />
                <span className="text-meta absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-6 pb-2 text-center text-white/80">
                    Photos coming soon
                </span>
            </div>
        );
    }

    const hero = photos[Math.min(active, photos.length - 1)];

    return (
        <div className="flex gap-2">
            <figure className="bg-surface-deep relative min-w-0 flex-1 overflow-hidden rounded-lg">
                <img
                    src={hero.url}
                    alt={hero.caption ? `${name} — ${hero.caption}` : name}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[16/9] size-full object-contain sm:aspect-[3/2]"
                />
                {hero.caption && (
                    <figcaption className="from-surface-deep/90 text-meta absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent px-3 pt-6 pb-2 text-white">
                        {hero.caption}
                    </figcaption>
                )}
            </figure>

            {photos.length > 1 && (
                <div className="flex w-14 shrink-0 flex-col gap-2 sm:w-16">
                    {photos.slice(0, 4).map((photo, index) => (
                        <button
                            key={photo.id}
                            type="button"
                            onClick={() => setActive(index)}
                            aria-label={photo.caption ?? `Photo ${index + 1}`}
                            aria-pressed={index === active}
                            className={cn(
                                'bg-surface-deep overflow-hidden rounded-md border-2 transition-colors',
                                index === active ? 'border-primary' : 'hover:border-border-strong border-transparent',
                            )}
                        >
                            <img src={photo.url} alt="" loading="lazy" decoding="async" className="aspect-square size-full object-contain" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
