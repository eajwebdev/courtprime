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
