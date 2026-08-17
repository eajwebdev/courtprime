import { BrandWordmark } from '@/components/marketing-artwork';
import { LiveBadge, StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { RadioTower } from 'lucide-react';
import { useEffect } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payload from the live match controller. */
type Props = { match: any; games: any[]; events: any[] };

export default function PublicLiveMatch({ match, games, events }: Props) {
    const isLive = String(match.status ?? '').toLowerCase() === 'live';

    /* A spectator view that never updates is just a screenshot. */
    useEffect(() => {
        if (!isLive) return;

        const timer = window.setInterval(() => {
            router.reload({ only: ['match', 'games', 'events'] });
        }, 10000);

        return () => window.clearInterval(timer);
    }, [isLive]);

    return (
        <>
            <Head title={`${match.team_one_name} vs ${match.team_two_name} | CourtPrime Live`} />

            <main className="bg-background min-h-svh">
                <header className="bg-surface-deep border-b border-white/10">
                    <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
                        <Link href="/" aria-label="EAJ CourtPrime home">
                            <BrandWordmark variant="onDark" height={30} className="h-7" />
                        </Link>
                        {isLive ? <LiveBadge /> : <StatusBadge status={match.status} />}
                    </div>
                </header>

                <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 sm:py-8">
                    {/* ---- Scoreboard ------------------------------------------- */}
                    <section className="bg-surface-deep text-surface-deep-foreground relative overflow-hidden rounded-2xl">
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-0"
                            style={{
                                background:
                                    'radial-gradient(22rem 16rem at 50% 0%, color-mix(in srgb, var(--primary) 22%, transparent) 0%, transparent 65%)',
                            }}
                        />

                        <div className="relative px-4 py-5 sm:px-7 sm:py-7">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-eyebrow text-primary flex items-center gap-1.5 uppercase">
                                        <RadioTower className="size-3.5 shrink-0" aria-hidden />
                                        Live match
                                    </p>
                                    <h1 className="mt-1.5 truncate text-lg font-semibold text-white sm:text-2xl">
                                        {match.court?.organization ?? 'CourtPrime Live'}
                                    </h1>
                                    <p className="text-meta mt-0.5 truncate text-white/55">
                                        {match.court?.branch ?? 'Branch'} · {match.court?.name ?? 'Court'} · Game {match.game_number}
                                    </p>
                                </div>
                                <StatusBadge status={match.verification_status ?? 'unverified'} />
                            </div>

                            {/* Scores scale with the viewport so this reads on a phone
                                and on a lobby screen from the same markup. */}
                            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:mt-8 sm:gap-4">
                                <Team name={match.team_one_name} score={match.team_one_score} serving={match.serving_team === 'team_one'} />
                                <span className="text-meta px-1 font-semibold text-white/35">VS</span>
                                <Team name={match.team_two_name} score={match.team_two_score} serving={match.serving_team === 'team_two'} />
                            </div>

                            <p className="text-meta mt-5 text-center text-white/45">
                                {String(match.format ?? '').replaceAll('_', ' ')} · first to {match.target_score}
                            </p>
                        </div>
                    </section>

                    {/* ---- Games ------------------------------------------------ */}
                    {games.length > 0 && (
                        <section className="mt-5">
                            <h2 className="text-h3 text-foreground">Games</h2>
                            <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                                {games.map((game) => (
                                    <li
                                        key={game.id}
                                        className="border-border bg-surface flex items-center justify-between gap-3 rounded-xl border p-4"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-label text-foreground font-semibold">Game {game.game_number}</p>
                                            <StatusBadge status={game.winner_team ?? 'in_progress'} className="mt-1" />
                                        </div>
                                        <p data-numeric className="text-h2 text-foreground shrink-0">
                                            {game.team_one_score} - {game.team_two_score}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* ---- Feed ------------------------------------------------- */}
                    <section className="mt-5">
                        <h2 className="text-h3 text-foreground">Match feed</h2>

                        {events.length === 0 ? (
                            <p className="border-border text-label text-muted mt-3 rounded-xl border border-dashed px-4 py-6 text-center">
                                No score events recorded yet.
                            </p>
                        ) : (
                            <ul className="divide-border border-border bg-surface mt-3 divide-y overflow-hidden rounded-xl border">
                                {events.map((event) => (
                                    <li key={event.id} className="flex items-center justify-between gap-3 p-4">
                                        <div className="min-w-0">
                                            <p className="text-label text-foreground truncate font-medium capitalize">
                                                {String(event.event_type ?? '').replaceAll('_', ' ')}
                                            </p>
                                            <p className="text-meta text-muted truncate capitalize">
                                                {String(event.team ?? 'match').replaceAll('_', ' ')}
                                            </p>
                                        </div>
                                        <p data-numeric className="text-label text-foreground shrink-0 font-semibold">
                                            {event.team_one_score} - {event.team_two_score}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <div className="mt-8 text-center">
                        <Button asChild variant="outline" size="touch" className="w-full sm:w-auto">
                            <Link href="/leaderboards">View network rankings</Link>
                        </Button>
                    </div>
                </div>
            </main>
        </>
    );
}

function Team({ name, score, serving }: { name: string; score: number; serving: boolean }) {
    return (
        <div
            className={cn(
                'min-w-0 rounded-xl border p-3 text-center transition-colors sm:p-4',
                serving ? 'border-primary/60 bg-primary/10' : 'border-white/10 bg-white/5',
            )}
        >
            <p className="text-meta truncate font-semibold text-white/70 uppercase">{name}</p>
            <p
                data-numeric
                aria-live="polite"
                className={cn('mt-2 text-[clamp(2.5rem,13vw,5rem)] leading-none font-black', serving ? 'text-primary' : 'text-white')}
            >
                {score}
            </p>
            {/* Serving is stated, not only tinted. */}
            <p className={cn('text-meta mt-1', serving ? 'text-primary font-semibold' : 'text-transparent')}>Serving</p>
        </div>
    );
}
