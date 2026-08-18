import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';

export type VenuePhoto = { id: number; url: string; caption?: string | null };

/**
 * Venue gallery.
 *
 * A hero image with a strip of thumbnails beside it, so a listing shows the
 * place rather than just naming it. Selection is local state and swaps the hero
 * without navigating, which keeps the directory scannable.
 *
 * Falls back to a single neutral panel when a club has not uploaded anything,
 * rather than inventing photos of a venue nobody has photographed.
 */
export function VenueGallery({ photos, name }: { photos: VenuePhoto[]; name: string }) {
    const [active, setActive] = useState(0);

    if (photos.length === 0) {
        return (
            <div className="bg-surface-muted text-muted flex aspect-[16/9] items-center justify-center rounded-lg sm:aspect-[3/2]">
                <span className="flex flex-col items-center gap-1.5">
                    <ImageOff className="size-5" aria-hidden />
                    <span className="text-meta">Photos coming soon</span>
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
