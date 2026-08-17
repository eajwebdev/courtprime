import { EmptyState } from '@/components/empty-state';
import { Section } from '@/components/layout-primitives';
import { AthleteArtwork } from '@/components/marketing-artwork';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { athleteFor } from '@/lib/athlete';
import { currency, friendlyDate, statusLabel, time12h } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Award, BadgeCheck, CalendarClock, IdCard, MapPin, QrCode, Trophy, Users } from 'lucide-react';
import { type ReactNode } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payloads come from PlayerPortalController. */
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Home', href: '/me' }];

type Props = {
    profile: any;
    identityUrl: string;
    qrIdentityUrl: string;
    connectedClubs: any[];
    reservations: any[];
    memberships: any[];
    tournamentRegistrations: any[];
    openPlay: any[];
    achievements: any[];
};

export default function PlayerPortal({
    profile,
    identityUrl,
    qrIdentityUrl,
    connectedClubs,
    reservations,
    memberships,
    tournamentRegistrations,
    openPlay,
    achievements,
}: Props) {
    const next = reservations[0];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Home | CourtPrime" />

            <div className="space-y-8">
                {/* ---- Identity ------------------------------------------------- */}
                <section className="bg-surface-deep text-surface-deep-foreground relative overflow-hidden rounded-2xl">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                'radial-gradient(22rem 16rem at 88% 15%, color-mix(in srgb, var(--primary) 24%, transparent) 0%, transparent 62%)',
                        }}
                    />
                    {/*
                     * The athlete stays visible on phones, not just tablets up.
                     * To keep the name legible over it the artwork is confined to
                     * the right ~44% and a left-to-right scrim is laid on top, so
                     * text sits on solid navy while the figure still reads.
                     */}
                    {profile.action_photo_url ? (
                        <img
                            src={profile.action_photo_url}
                            alt=""
                            aria-hidden
                            className="pointer-events-none absolute right-0 bottom-0 h-full w-[34%] object-cover object-top opacity-70 sm:-right-4 sm:h-[118%] sm:w-auto sm:object-contain sm:object-bottom sm:opacity-80"
                        />
                    ) : (
                        <AthleteArtwork
                            asset={athleteFor(profile.gender)}
                            decorative
                            sizes="(max-width: 640px) 45vw, 240px"
                            className="pointer-events-none absolute -right-3 bottom-0 h-[112%] w-auto max-w-[34%] object-contain object-bottom opacity-70 sm:-right-8 sm:max-w-[46%] sm:opacity-60 lg:max-w-none"
                        />
                    )}

                    {/* Scrim: opaque under the text, clear over the figure. */}
                    <div
                        aria-hidden
                        className="from-surface-deep via-surface-deep/92 sm:via-surface-deep/80 pointer-events-none absolute inset-0 bg-gradient-to-r to-transparent"
                    />

                    <div className="relative px-5 py-6 sm:px-7 sm:py-7">
                        {/* Leaves room for the figure instead of running under it. */}
                        <div className="flex max-w-[72%] items-center gap-3 sm:max-w-none sm:gap-3.5">
                            <div className="border-primary/40 size-14 shrink-0 overflow-hidden rounded-full border-2 bg-white/10 sm:size-16">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="" className="size-full object-cover" />
                                ) : (
                                    <span className="text-h2 flex size-full items-center justify-center font-semibold text-white">
                                        {String(profile.display_name ?? '')
                                            .split(' ')
                                            .filter(Boolean)
                                            .slice(0, 2)
                                            .map((part: string) => part[0]?.toUpperCase() ?? '')
                                            .join('')}
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-eyebrow text-primary uppercase">One player identity</p>
                                {/* Wraps to a second line rather than clipping the name. */}
                                <h1 className="mt-0.5 text-[1.25rem] leading-tight font-semibold tracking-tight text-white sm:text-[1.75rem] lg:text-[2rem]">
                                    {profile.display_name}
                                </h1>
                                <p data-numeric className="text-meta text-white/55">
                                    {profile.courtprime_player_id}
                                </p>
                            </div>
                        </div>

                        {/* 2x2 on phones, one band from sm up. Four stacked full-width
                            cards wasted the entire first screen. */}
                        <dl className="relative mt-5 grid max-w-md grid-cols-4 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10">
                            <Metric label="Rating" value={Number(profile.global_rating ?? 2.5).toFixed(2)} />
                            <Metric label="Matches" value={profile.global_match_count ?? 0} />
                            <Metric label="Wins" value={profile.wins ?? 0} />
                            <Metric label="Clubs" value={connectedClubs.length} />
                        </dl>
                    </div>
                </section>

                {/* ---- What am I doing next ------------------------------------- */}
                {/*
                 * Two lines instead of a tinted header plus a body plus a badge
                 * row. The accent bar carries the "this is next" signal the
                 * header bar used to, at zero vertical cost, and the two status
                 * pills collapse into one muted line.
                 */}
                <section>
                    <h2 className="text-h3 text-foreground mb-3">Next up</h2>
                    {next ? (
                        <div className="border-border bg-surface relative flex items-center gap-3 overflow-hidden rounded-xl border py-3 pr-4 pl-4">
                            <span aria-hidden className="bg-primary absolute inset-y-0 left-0 w-1" />

                            <div className="min-w-0 flex-1">
                                <p className="text-label text-foreground flex items-center gap-1.5 font-semibold">
                                    <CalendarClock className="text-primary size-3.5 shrink-0" aria-hidden />
                                    <span className="truncate">
                                        {friendlyDate(next.reservation_date)} · {time12h(next.start_time)}
                                        <span className="text-muted font-normal"> to {time12h(next.end_time)}</span>
                                    </span>
                                </p>
                                <p className="text-meta text-muted mt-1 truncate">
                                    {next.branch?.organization ?? 'CourtPrime club'} · {next.court?.name ?? 'Court'}
                                    <span className="text-secondary capitalize"> · {statusLabel(next.booking_status)}</span>
                                    {next.payment_status !== 'paid' && (
                                        <span className="text-warning capitalize"> · {statusLabel(next.payment_status)}</span>
                                    )}
                                </p>
                            </div>

                            <p data-numeric className="text-label text-foreground shrink-0 font-semibold">
                                {currency(next.amount_due)}
                            </p>
                        </div>
                    ) : (
                        <EmptyState
                            title="Nothing booked yet"
                            description="Find a connected club and reserve your next court."
                            artwork="/cp-paddle.png"
                            action={
                                <Button asChild size="touch">
                                    <Link href="/me/book">Book a court</Link>
                                </Button>
                            }
                        />
                    )}
                </section>

                {/* ---- Actions. Primary first, full width on phones. ------------- */}
                <section>
                    <Button asChild size="touch" className="w-full">
                        <Link href="/me/book">
                            <CalendarClock className="size-4" />
                            Book a court
                        </Link>
                    </Button>

                    <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                        <ActionButton href={qrIdentityUrl} icon={QrCode} label="Show QR ID" />
                        <ActionButton href={identityUrl} icon={IdCard} label="Public ID" />
                        <ActionButton href="/find-open-play" icon={Users} label="Open play" />
                        <ActionButton href="/find-tournaments" icon={Trophy} label="Tournaments" />
                    </div>
                </section>

                {/* ---- Upcoming ------------------------------------------------- */}
                {reservations.length > 1 && (
                    <Section title="Upcoming bookings">
                        <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-xl border">
                            {reservations.slice(1).map((reservation: any) => (
                                <li key={reservation.id} className="flex items-center justify-between gap-3 p-4">
                                    <div className="min-w-0">
                                        <p className="text-label text-foreground truncate font-medium">
                                            {reservation.branch?.organization ?? 'CourtPrime club'}
                                        </p>
                                        <p className="text-meta text-muted truncate">
                                            {friendlyDate(reservation.reservation_date)} · {time12h(reservation.start_time)} ·{' '}
                                            {reservation.court?.name ?? 'Court'}
                                        </p>
                                    </div>
                                    <StatusBadge status={reservation.booking_status} />
                                </li>
                            ))}
                        </ul>
                    </Section>
                )}

                {/* ---- Connected clubs ------------------------------------------ */}
                <Section title="Connected clubs" description="Your identity is shared. Each club keeps its own wallet.">
                    {connectedClubs.length === 0 ? (
                        <EmptyState
                            title="No connected clubs yet"
                            description="Book or check in at any CourtPrime venue to connect."
                            artwork="/cp-paddle4.png"
                            action={
                                <Button asChild variant="outline">
                                    <Link href="/find-courts">Find a club</Link>
                                </Button>
                            }
                        />
                    ) : (
                        <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-xl border">
                            {connectedClubs.map((club: any) => (
                                <li key={club.id} className="flex items-center justify-between gap-3 p-4">
                                    <div className="min-w-0">
                                        <p className="text-label text-foreground truncate font-medium">{club.organization}</p>
                                        <p className="text-meta text-muted flex items-center gap-1.5 truncate">
                                            <MapPin className="size-3 shrink-0" aria-hidden />
                                            {club.home_branch ?? 'No home branch'}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p data-numeric className="text-label text-foreground font-semibold">
                                            {currency(club.wallet_balance)}
                                        </p>
                                        <p className="text-meta text-muted">wallet</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>

                {/* ---- Activity, collapsed into one list per type ----------------- */}
                {/* One icon band instead of four collapsible rows. Four rows of
                    "0" cost ~240px of scroll to say nothing; this says the same
                    in one. Detail lists render only when there is detail. */}
                <section>
                    <h2 className="text-h3 text-foreground mb-3">Your activity</h2>

                    <dl className="bg-border border-border grid grid-cols-4 gap-px overflow-hidden rounded-xl border">
                        <ActivityStat icon={BadgeCheck} label="Members" value={memberships.length} />
                        <ActivityStat icon={Trophy} label="Events" value={tournamentRegistrations.length} />
                        <ActivityStat icon={Users} label="Open play" value={openPlay.length} />
                        <ActivityStat icon={Award} label="Badges" value={achievements.length} />
                    </dl>

                    {/* Only surfaced when non-empty, so a new account sees the band alone. */}
                    <ActivityList
                        title="Memberships"
                        items={memberships.map((membership: any) => ({
                            id: membership.id,
                            title: membership.plan ?? 'Membership',
                            meta: membership.organization ?? 'CourtPrime club',
                            status: membership.status,
                        }))}
                    />
                    <ActivityList
                        title="Tournaments"
                        items={tournamentRegistrations.map((registration: any) => ({
                            id: registration.id,
                            title: registration.tournament?.name ?? 'Tournament',
                            meta: registration.division ?? 'Division',
                            status: registration.status,
                        }))}
                    />
                    <ActivityList
                        title="Open play"
                        items={openPlay.map((entry: any) => ({
                            id: entry.id,
                            title: entry.session?.name ?? 'Open play',
                            meta: friendlyDate(entry.session?.session_date) || 'Date pending',
                            status: entry.status,
                        }))}
                    />
                    <ActivityList
                        title="Achievements"
                        items={achievements.map((achievement: any) => ({
                            id: achievement.id,
                            title: achievement.title,
                            meta: achievement.earned_at ? `Earned ${achievement.earned_at}` : (achievement.organization ?? 'CourtPrime'),
                            status: null,
                        }))}
                    />
                </section>

                <div className="pt-2">
                    <Button asChild variant="outline" size="touch" className="w-full">
                        <Link href="/me/profile">Edit profile</Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="bg-surface-deep px-2 py-2.5 sm:px-4 sm:py-3">
            {/* Four cells across a 360px screen leaves ~80px each, so the label
                truncates rather than wrapping the row to two lines. */}
            <dt className="truncate text-[0.6875rem] tracking-wide text-white/45 uppercase">{label}</dt>
            <dd data-numeric className="mt-0.5 text-lg leading-none font-semibold text-white sm:text-[1.375rem]">
                {value}
            </dd>
        </div>
    );
}

function ActionButton({ href, icon: Icon, label }: { href: string; icon: typeof QrCode; label: string }) {
    const external = href.startsWith('http');
    const inner = (
        <>
            <Icon className="text-primary size-[18px]" aria-hidden />
            <span className="text-muted mt-1 w-full truncate text-center text-[0.6875rem] font-medium">{label}</span>
        </>
    );
    /* min-h-16 keeps the whole cell a comfortable tap target even though the
       icon and label are compact. */
    const className = 'bg-surface hover:bg-surface-muted flex min-h-16 flex-col items-center justify-center px-1 transition-colors';

    return external ? (
        <a href={href} className={className}>
            {inner}
        </a>
    ) : (
        <Link href={href} className={className}>
            {inner}
        </Link>
    );
}

function ActivityStat({ icon: Icon, label, value }: { icon: typeof Award; label: string; value: number }) {
    return (
        <div className="bg-surface px-2 py-3 text-center sm:px-3">
            <Icon className={cn('mx-auto size-4', value > 0 ? 'text-primary' : 'text-muted')} aria-hidden />
            <dd data-numeric className={cn('mt-1.5 text-lg leading-none font-semibold', value > 0 ? 'text-foreground' : 'text-muted')}>
                {value}
            </dd>
            <dt className="text-muted mt-1 truncate text-[0.6875rem] tracking-wide uppercase">{label}</dt>
        </div>
    );
}

function ActivityList({ title, items }: { title: string; items: { id: number | string; title: string; meta: string; status: string | null }[] }) {
    if (items.length === 0) {
        return null;
    }

    return (
        <div className="mt-4">
            <h3 className="text-meta text-muted mb-2 tracking-wide uppercase">{title}</h3>
            <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-xl border">
                {items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                            <p className="text-label text-foreground truncate">{item.title}</p>
                            <p className="text-meta text-muted truncate">{item.meta}</p>
                        </div>
                        {item.status && <StatusBadge status={item.status} />}
                    </li>
                ))}
            </ul>
        </div>
    );
}
