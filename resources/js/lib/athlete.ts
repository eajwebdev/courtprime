/**
 * Athlete artwork for a player's identity band.
 *
 * Only two assets are used: cp-model4 for male, cp-model3 for female. Anything
 * unset or "prefer not to say" falls back to cp-model3, which is the artwork
 * the identity card shipped with.
 *
 * This reads the player's stated `gender` field only. It never infers from a
 * name, because a wrong guess misgenders a real person.
 */
export function athleteFor(gender?: string | null): string {
    switch (String(gender ?? '').toLowerCase()) {
        case 'male':
        case 'man':
            return '/cp-model4.png';
        default:
            return '/cp-model3.png';
    }
}

/**
 * A stand-in portrait for a player with no photo.
 *
 * These are the square bust images: head and shoulders, paddle up, on a plain
 * ground, which is what an avatar needs. The full body `cp-model*` artwork is
 * for identity bands and heroes, and crops to a torso in a 40px circle.
 *
 * Three per gender, picked by a stable hash of whoever it is, so a club roster
 * is not forty copies of the same face and the same person keeps the same one
 * from one page to the next.
 *
 * Returns null unless gender is actually stated. These are pictures of people,
 * and handing an unstated player a face of one gender is a guess about them
 * that initials never make. The caller falls back to initials, which is the
 * honest answer to "we do not know".
 */
export function defaultAvatarFor(gender?: string | null, seed?: string | number | null): string | null {
    const stated = String(gender ?? '').toLowerCase();

    const set = stated === 'male' || stated === 'man' ? 'male' : stated === 'female' || stated === 'woman' ? 'female' : null;

    if (!set) {
        return null;
    }

    const key = String(seed ?? '');
    let hash = 0;

    for (let index = 0; index < key.length; index += 1) {
        hash = (hash * 31 + key.charCodeAt(index)) % 997;
    }

    return `/${set}_pickleball_default_${(hash % 3) + 1}.png`;
}

/**
 * A doubles scene, for a venue with no photos of its own yet.
 *
 * Mixed by default because it is the one that represents a club rather than a
 * category of player. The court and the club are the subject here, not who is
 * on it, so this does not take a gender.
 */
export function defaultVenueArt(seed?: string | number | null): string {
    const options = [
        '/pickleball_doubles_mixed_1.png',
        '/pickleball_doubles_mixed_2.png',
        '/pickleball_doubles_male.png',
        '/pickleball_doubles_female.png',
    ];

    const key = String(seed ?? '');
    let hash = 0;

    for (let index = 0; index < key.length; index += 1) {
        hash = (hash * 31 + key.charCodeAt(index)) % 997;
    }

    return options[hash % options.length];
}
