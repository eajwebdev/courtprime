import { DiscoveryHero } from '@/components/discovery/discovery-chrome';
import { DiscoveryPage } from '@/components/discovery/discovery-page';
import { EmptyState } from '@/components/empty-state';
import { StatusBadge } from '@/components/status-badge';
import { revealProps } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { Medal } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payload from PlayerIdentityController. */

function initials(name: string) {
    return String(name ?? '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export default function PublicRankings({ rankings }: { rankings: any[] }) {
    const reduce = useReducedMotion();

    return (
        <>
            <Head title="Leaderboards | CourtPrime">
                <meta
                    name="description"
                    content="Global CourtPrime rankings built from verified player identity records across every connected club."
                />
            </Head>

            <DiscoveryPage current="/leaderboards">
                <DiscoveryHero
                    eyebrow="CourtPrime player network"
                    title="One leaderboard for every connected court."
                    description="Rankings come from verified player records across the network, without exposing any club's private business data."
                    artwork="/cp-model4.png"
                />

                <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
                    {rankings.length === 0 ? (
                        <EmptyState
                            title="No public rankings yet"
                            description="Rankings appear once clubs verify match results."
                            artwork="/cp-paddle4.png"
                        />
                    ) : (
                        <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-xl border">
                            {rankings.map((ranking, index) => {
                                const podium = ranking.rank <= 3;

                                return (
                                    <motion.li
                                        key={ranking.courtprime_player_id}
                                        {...revealProps(reduce, { delay: Math.min(index, 8) * 0.03, y: 10 })}
                                        className="hover:bg-surface-muted flex items-center gap-3 p-3 transition-colors sm:gap-4 sm:p-4"
                                    >
                                        {/* Rank */}
                                        <span
                                            data-numeric
                                            className={cn(
                                                'flex size-10 shrink-0 items-center justify-center rounded-lg font-bold',
                                                podium ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-secondary',
                                            )}
                                        >
                                            {podium ? <Medal className="size-5" /> : ranking.rank}
                                        </span>

                                        {/* Avatar */}
                                        <span className="bg-surface-muted border-border size-10 shrink-0 overflow-hidden rounded-full border">
                                            {ranking.avatar_url ? (
                                                <img src={ranking.avatar_url} alt="" className="size-full object-cover" />
                                            ) : (
                                                <span className="text-meta text-muted flex size-full items-center justify-center font-semibold">
                                                    {initials(ranking.display_name)}
                                                </span>
                                            )}
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <Link
                                                href={`/player-identities/${ranking.courtprime_player_id}`}
                                                className="text-label text-foreground hover:text-primary block truncate font-semibold"
                                            >
                                                {ranking.display_name}
                                            </Link>
                                            <p data-numeric className="text-meta text-muted truncate">
                                                {ranking.courtprime_player_id} · {ranking.matches} matches
                                            </p>
                                        </div>

                                        {/* Skill hides below sm; rating is what people scan for. */}
                                        <span className="hidden sm:block">
                                            <StatusBadge status={ranking.skill_level ?? 'open'} />
                                        </span>

                                        <div className="shrink-0 text-right">
                                            <p data-numeric className="text-h3 text-foreground">
                                                {ranking.rating}
                                            </p>
                                            <p data-numeric className="text-meta text-muted">
                                                {ranking.wins}W / {ranking.losses}L
                                            </p>
                                        </div>
                                    </motion.li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </DiscoveryPage>
        </>
    );
}
