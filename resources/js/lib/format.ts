export function currency(value: number | string | null | undefined, code = 'PHP') {
    const amount = Number(value ?? 0);

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: code,
        maximumFractionDigits: 0,
    }).format(amount);
}

/** Compact form for KPI bands and chart axes, 84,320 becomes ₱84.3K. */
export function currencyCompact(value: number | string | null | undefined, code = 'PHP') {
    const amount = Number(value ?? 0);

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: code,
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(amount);
}

export function compactNumber(value: number | string | null | undefined) {
    return new Intl.NumberFormat('en-PH', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value ?? 0));
}

export function percent(value: number | string | null | undefined, fractionDigits = 0) {
    return new Intl.NumberFormat('en-PH', {
        style: 'percent',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(Number(value ?? 0) / 100);
}

export type StatusTone = 'live' | 'available' | 'reserved' | 'maintenance' | 'openPlay' | 'danger' | 'neutral';

const TONE_MAP: Record<StatusTone, readonly string[]> = {
    available: ['available', 'active', 'paid', 'converted', 'completed', 'approved', 'open', 'in_stock', 'settled'],
    live: ['live', 'occupied', 'playing', 'in_progress', 'ongoing', 'checked_in'],
    openPlay: ['open_play', 'queued', 'waiting', 'waitlist'],
    reserved: ['reserved', 'confirmed', 'partial', 'trial', 'scheduled', 'upcoming', 'booked'],
    maintenance: ['maintenance', 'pending', 'new', 'draft', 'low_stock', 'on_hold', 'expiring'],
    danger: ['cancelled', 'canceled', 'failed', 'overdue', 'void', 'expired', 'rejected', 'out_of_stock', 'suspended'],
    neutral: [],
};

/** Maps a domain status string onto one of the seven CourtPrime status tones. */
export function statusTone(status: string): StatusTone {
    const normalized = String(status ?? '')
        .toLowerCase()
        .trim();

    for (const [tone, values] of Object.entries(TONE_MAP) as [StatusTone, readonly string[]][]) {
        if (values.includes(normalized)) {
            return tone;
        }
    }

    return 'neutral';
}

/** Human-readable label, `open_play` becomes `open play`. */
export function statusLabel(status: string) {
    return String(status ?? '')
        .replaceAll('_', ' ')
        .toLowerCase();
}

/* -------------------------------------------------------------------------- */
/* Dates and times                                                             */
/* -------------------------------------------------------------------------- */

/** `18:00:00` or `18:00` becomes `6:00 PM`. Players do not read 24h clocks. */
export function time12h(value?: string | null) {
    if (!value) return '';

    const [rawHour, rawMinute] = String(value).split(':');
    const hour = Number(rawHour);
    if (Number.isNaN(hour)) return String(value);

    const suffix = hour >= 12 ? 'PM' : 'AM';
    const display = hour % 12 === 0 ? 12 : hour % 12;

    return `${display}:${(rawMinute ?? '00').slice(0, 2)} ${suffix}`;
}

/** `2026-08-17` becomes `Today`, `Tomorrow`, or `Mon 17 Aug`. */
export function friendlyDate(value?: string | null) {
    if (!value) return '';

    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((date.getTime() - today.getTime()) / 86400000);

    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';

    return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Short chip label: `Today`, `Tomorrow`, then `Thu 20`. */
export function shortDayLabel(offset: number) {
    if (offset === 0) return 'Today';
    if (offset === 1) return 'Tomorrow';

    const date = new Date();
    date.setDate(date.getDate() + offset);

    /* Weekday first reads better than the locale default "20 Thu". */
    const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
    return `${weekday} ${date.getDate()}`;
}

/**
 * Today's date in the *browser's* timezone, as `YYYY-MM-DD`.
 *
 * `new Date().toISOString().slice(0, 10)` returns the UTC date, so anywhere
 * ahead of UTC (Manila is +8) it reports yesterday for the first eight hours of
 * every day. That is what made the date chips select a past date.
 */
export function localIsoDate(offsetDays = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * "just now", "4m ago", "2h ago", then the clock time.
 *
 * Used by the open play activity log, where the useful question is almost
 * always "did that happen this game or an hour ago", not the exact timestamp.
 */
export function timeAgo(value?: string | null) {
    if (!value) return '';

    const then = new Date(value).getTime();
    if (Number.isNaN(then)) return '';

    const seconds = Math.round((Date.now() - then) / 1000);

    if (seconds < 45) return 'just now';
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
    if (seconds < 21600) return `${Math.round(seconds / 3600)}h ago`;

    return new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
