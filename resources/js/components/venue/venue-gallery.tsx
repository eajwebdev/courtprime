import { cn } from '@/lib/utils';
import { useState } from 'react';

export type VenuePhoto = { id: number; url: string; caption?: string | null };

/** A club shows four, which is a gallery without becoming a scroll. */
const SLOTS = 4;

/**
 * Four CourtPrime product shots, one per slot, standing in until a club
 * uploads its own. Fixed to a slot each rather than repeated or randomised,
 * so the same venue reads the same way on a second visit and a club that has
 * uploaded two photos sees its two plus these two, not a shuffled set.
 */
const DEFAULT_ART = ['/cp-paddle.png', '/cp-paddle2.png', '/cp-paddle3.png', '/cp-paddle4.png'];

/**
 * Venue gallery.
 *
 * Four images: a hero with the other three beside it, so a listing shows the
 * place rather than naming it. Selection is local state and swaps the hero
 * without navigating, which keeps the directory scannable.
 *
 * A club with fewer than four real photos gets CourtPrime artwork in the slots
 * it has not filled yet, shown at full strength like any other tile rather than
 * faded out, with a caption marking it as a sample so nobody mistakes a paddle
 * render for a photo of the court.
 */
export function VenueGallery({ photos, name }: { photos: VenuePhoto[]; name: string }) {
    const [active, setActive] = useState(0);

    const real = photos.slice(0, SLOTS);
    const slots = Array.from({ length: SLOTS }, (_, index) => real[index] ?? null);

    const hero = slots[Math.min(active, SLOTS - 1)];
    const heroIsSample = !hero;

    return (
        <div className="flex gap-2">
            <figure className="bg-surface-deep relative min-w-0 flex-1 overflow-hidden rounded-lg">
                <img
                    src={hero ? hero.url : DEFAULT_ART[Math.min(active, SLOTS - 1)]}
                    alt={hero ? (hero.caption ? `${name} — ${hero.caption}` : name) : ''}
                    aria-hidden={heroIsSample || undefined}
                    loading="lazy"
                    decoding="async"
                    className={cn('aspect-[16/9] size-full sm:aspect-[3/2]', heroIsSample ? 'object-contain p-6' : 'object-cover')}
                />
                {hero?.caption && (
                    <figcaption className="from-surface-deep/90 text-meta absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent px-3 pt-6 pb-2 text-white">
                        {hero.caption}
                    </figcaption>
                )}
                {heroIsSample && (
                    <span className="text-meta bg-surface-deep/80 text-muted absolute top-2 left-2 rounded-full px-2.5 py-1 backdrop-blur-sm">
                        Sample · {real.length > 0 ? 'more photos coming' : 'photos coming soon'}
                    </span>
                )}
            </figure>

            <div className="flex w-14 shrink-0 flex-col gap-2 sm:w-16">
                {slots.map((photo, index) => (
                    <button
                        key={photo?.id ?? `sample-${index}`}
                        type="button"
                        onClick={() => setActive(index)}
                        aria-label={photo ? (photo.caption ?? `Photo ${index + 1}`) : `Sample image ${index + 1}`}
                        aria-pressed={index === active}
                        className={cn(
                            'bg-surface-deep relative overflow-hidden rounded-md border-2 transition-colors',
                            index === active ? 'border-primary' : 'hover:border-border-strong border-transparent',
                        )}
                    >
                        <img
                            src={photo ? photo.url : DEFAULT_ART[index]}
                            alt=""
                            aria-hidden
                            loading="lazy"
                            decoding="async"
                            className={cn('aspect-square size-full', photo ? 'object-cover' : 'object-contain p-1.5')}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}
