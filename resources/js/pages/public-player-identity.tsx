import { BrandWordmark } from '@/components/marketing-artwork';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import { Activity, Award, MapPin, Star } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payload from PlayerIdentityController. */

function initials(name: string) {
    return String(name ?? '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export default function PublicPlayerIdentity({ profile }: { profile: any }) {
    const hasAction = Boolean(profile.action_photo_url);

    return (
        <>
            <Head title={`${profile.display_name} | CourtPrime`} />

            <main className="bg-background min-h-svh">
                <header className="border-border bg-surface-deep border-b">
                    <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
                        <Link href="/" aria-label="EAJ CourtPrime home">
                            <BrandWordmark variant="onDark" height={30} className="h-7" />
                        </Link>
                        <Button asChild size="sm" variant="onDeep">
                            <Link href="/login">Sign in</Link>
                        </Button>
                    </div>
                </header>

                <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
                    {/* ---- Identity card ---------------------------------------- */}
                    <section className="bg-surface-deep text-surface-deep-foreground relative overflow-hidden rounded-2xl">
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-0"
                            style={{
                                background:
                                    'radial-gradient(24rem 18rem at 85% 15%, color-mix(in srgb, var(--primary) 26%, transparent) 0%, transparent 62%)',
                            }}
                        />

                        {/* The player's own full-body shot is the hero when they have
                            one. Without it the card stays a clean type-led layout. */}
                        {hasAction && (
                            <img
                                src={profile.action_photo_url}
                                alt=""
                                aria-hidden
                                className="pointer-events-none absolute right-0 bottom-0 h-full w-1/2 object-cover object-top opacity-45 sm:w-2/5 sm:opacity-70"
                            />
                        )}
                        {hasAction && (
                            <div aria-hidden className="from-surface-deep via-surface-deep/85 absolute inset-0 bg-gradient-to-r to-transparent" />
                        )}

                        <div className="relative px-5 py-6 sm:px-7 sm:py-8">
                            <div className="flex items-center gap-4">
                                <div className="border-primary/50 size-16 shrink-0 overflow-hidden rounded-full border-2 bg-white/10 sm:size-20">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="" className="size-full object-cover" />
                                    ) : (
                                        <span className="flex size-full items-center justify-center text-xl font-semibold text-white">
                                            {initials(profile.display_name)}
                                        </span>
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <p data-numeric className="text-meta text-primary font-semibold tracking-wide uppercase">
                                        {profile.courtprime_player_id}
                                    </p>
                                    <h1 className="mt-0.5 truncate text-[1.5rem] leading-tight font-semibold tracking-tight text-white sm:text-[2rem]">
                                        {profile.display_name}
                                    </h1>
                                    <p className="text-meta text-white/55 capitalize">{profile.skill_level}</p>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <StatusBadge status={profile.verification_status} />
                                {profile.qr_verified && <StatusBadge status="active" label="QR verified" />}
                            </div>

                            {/* 3-up band. Private values say so rather than showing a blank. */}
                            <dl className="mt-6 grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10">
                                <Metric icon={Star} label="Rating" value={profile.global_rating ?? 'Private'} />
                                <Metric icon={Activity} label="Matches" value={profile.global_match_count ?? 'Private'} />
                                <Metric icon={MapPin} label="City" value={profile.home_city ?? 'Private'} />
                            </dl>
                        </div>
                    </section>

                    {profile.connected_clubs?.length > 0 && (
                        <section className="mt-6">
                            <h2 className="text-h3 text-foreground">Connected clubs</h2>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {profile.connected_clubs.map((club: string) => (
                                    <span key={club} className="border-border bg-surface text-label text-secondary rounded-full border px-3 py-1.5">
                                        {club}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {profile.achievements?.length > 0 && (
                        <section className="mt-6">
                            <h2 className="text-h3 text-foreground">Achievements</h2>
                            <ul className="divide-border border-border bg-surface mt-3 divide-y overflow-hidden rounded-xl border">
                                {profile.achievements.map((achievement: any) => (
                                    <li key={achievement.id} className="flex items-start gap-3 p-4">
                                        <span className="bg-primary-soft text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                                            <Award className="size-4" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-label text-foreground font-semibold">{achievement.title}</p>
                                            <p className="text-meta text-muted mt-0.5">
                                                {achievement.description ?? achievement.organization ?? 'CourtPrime network achievement'}
                                            </p>
                                            {achievement.earned_at && <p className="text-meta text-muted mt-1">Earned {achievement.earned_at}</p>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <p className="text-meta text-muted mt-8 text-center">
                        One player identity. Every connected court.{' '}
                        <Link href="/register" className="text-primary font-medium hover:underline">
                            Create yours
                        </Link>
                    </p>
                </div>
            </main>
        </>
    );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string | number }) {
    return (
        <div className="bg-surface-deep px-3 py-3">
            <dt className="flex items-center gap-1.5 text-[0.6875rem] tracking-wider text-white/45 uppercase">
                <Icon className="size-3 shrink-0" aria-hidden />
                {label}
            </dt>
            <dd data-numeric className="mt-1 truncate text-lg leading-none font-semibold text-white">
                {value}
            </dd>
        </div>
    );
}
