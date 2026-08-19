import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * An error the server returned under a key the form has no field for.
 *
 * `useForm` types `errors` from the shape of the data, so a failure that is
 * about the request rather than a field — no cashier session open, the plan
 * does not include this, the items the server assembled from flat inputs —
 * has nowhere to land and reads as a type error. These are real keys the
 * server really sends; this says so once instead of casting at each one.
 */
export function serverError(errors: object, key: string): string | undefined {
    return (errors as Record<string, string | undefined>)[key];
}
