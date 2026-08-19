import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { defaultAvatarFor } from '@/lib/athlete';

type PlayerAvatarProps = {
    name?: string | null;
    image?: string | null;
    /** Stated gender, for choosing the stand-in portrait. Never inferred. */
    gender?: string | null;
};

/**
 * A player's face.
 *
 * Without a photo this used to be two letters, which is fine on one row and
 * grim down a roster of forty. It now falls back to the stock portraits, picked
 * by gender and varied by name, and only drops to initials if even that fails
 * to load.
 */
export function PlayerAvatar({ name, image, gender }: PlayerAvatarProps) {
    const fallback = (name ?? 'CP')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

    /* No photo and no stated gender leaves initials, which assumes nothing. */
    const src = image || defaultAvatarFor(gender, name);

    return (
        <Avatar>
            {src && <AvatarImage src={src} alt={name ?? 'CourtPrime player'} />}
            <AvatarFallback>{fallback || 'CP'}</AvatarFallback>
        </Avatar>
    );
}
