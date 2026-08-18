import { Facebook, Globe, Instagram, Music2, Phone } from 'lucide-react';

export type VenueLinkSet = {
    website?: string | null;
    facebook?: string | null;
    instagram?: string | null;
    tiktok?: string | null;
};

const CHANNELS = [
    { key: 'website', label: 'Website', icon: Globe },
    { key: 'facebook', label: 'Facebook', icon: Facebook },
    { key: 'instagram', label: 'Instagram', icon: Instagram },
    { key: 'tiktok', label: 'TikTok', icon: Music2 },
] as const;

/**
 * A club's own channels, plus its phone number.
 *
 * Icon-only so a club with four channels costs one line, not four. Every link
 * carries an accessible name, and `rel="noopener"` because these point off-site
 * to addresses the club controls.
 */
export function VenueLinks({ links, phone, name }: { links?: VenueLinkSet | null; phone?: string | null; name: string }) {
    const available = CHANNELS.filter((channel) => Boolean(links?.[channel.key]));

    if (available.length === 0 && !phone) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {available.map((channel) => {
                const Icon = channel.icon;
                return (
                    <a
                        key={channel.key}
                        href={links![channel.key]!}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${name} on ${channel.label}`}
                        title={channel.label}
                        className="border-border bg-surface text-muted hover:text-primary hover:border-border-strong flex size-8 items-center justify-center rounded-md border transition-colors"
                    >
                        <Icon className="size-3.5" aria-hidden />
                    </a>
                );
            })}

            {phone && (
                <a
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    aria-label={`Call ${name}`}
                    title={phone}
                    className="border-border bg-surface text-muted hover:text-primary hover:border-border-strong flex size-8 items-center justify-center rounded-md border transition-colors"
                >
                    <Phone className="size-3.5" aria-hidden />
                </a>
            )}
        </div>
    );
}
