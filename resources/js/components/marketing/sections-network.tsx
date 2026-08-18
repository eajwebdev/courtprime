import { FloatingSportAccent } from '@/components/marketing-artwork';
import { MarketingSection } from '@/components/marketing/marketing-section';
import { LiveBadge, StatusBadge } from '@/components/status-badge';
import { EASE, revealProps } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

/* ========================================================================== */
/* SECTION 5, Live CourtPrime network                                        */
/* ========================================================================== */

type LiveMatch = {
    org: string;
    court: string;
    home: string;
    away: string;
    score: [number, number];
    status: string;
};

/* Illustrative live board. Club names come from real connected locations so the
   page never advertises a venue that does not exist. */
const MATCH_SHAPE = [
    { court: 'Court 03', home: 'Team A', away: 'Team B', score: [11, 8] as [number, number], status: 'live' },
    { court: 'Championship Court', home: 'Team C', away: 'Team D', score: [7, 5] as [number, number], status: 'live' },
    { court: 'Court 02', home: 'Open play', away: '6 in queue', score: [0, 0] as [number, number], status: 'open_play' },
    { court: 'Court 01', home: 'Team E', away: 'Team F', score: [9, 9] as [number, number], status: 'live' },
];

function buildMatches(clubs: { name: string }[]): LiveMatch[] {
    return MATCH_SHAPE.map((shape, index) => ({
        ...shape,
        org: clubs[index % Math.max(clubs.length, 1)]?.name ?? `Connected club ${index + 1}`,
    }));
}

export function SectionLiveNetwork({ clubs = [] }: { clubs?: { name: string }[] }) {
    const reduce = useReducedMotion();
    const [matches, setMatches] = useState(() => buildMatches(clubs));

    /* Restrained live behaviour: one point lands every few seconds, nothing else. */
    useEffect(() => {
        if (reduce) return;

        const timer = window.setInterval(() => {
            setMatches((current) => {
                const liveIndexes = current.map((match, index) => (match.status === 'live' ? index : -1)).filter((index) => index >= 0);
                if (liveIndexes.length === 0) return current;

                const target = liveIndexes[Math.floor(Math.random() * liveIndexes.length)];
                return current.map((match, index) => {
                    if (index !== target) return match;
                    const side = Math.random() > 0.5 ? 0 : 1;
                    const next: [number, number] = [...match.score] as [number, number];
                    next[side] = next[side] >= 11 ? 0 : next[side] + 1;
                    return { ...match, score: next };
                });
            });
        }, 3200);

        return () => window.clearInterval(timer);
    }, [reduce]);

    return (
        <MarketingSection
            id="live"
            tone="deep"
            eyebrow="Section 05 · Live network"
            title={
                <>
                    Right now, across the <span className="text-primary">CourtPrime network.</span>
                </>
            }
            description="Every connected club scores into the same live layer. Players, lobby displays and organisers all read the same source of truth."
        >
            <div className="relative">
                <FloatingSportAccent className="pointer-events-none absolute -top-24 -right-6 hidden size-40 opacity-40 lg:block" />

                <div className="grid gap-4 sm:grid-cols-2">
                    {matches.map((match, index) => (
                        <motion.article
                            /* Club names are not unique across organizations. */
                            key={`${match.org}-${index}`}
                            {...revealProps(reduce, { delay: index * 0.07, y: 18 })}
                            className="rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-label truncate font-semibold text-white">{match.org}</p>
                                    <p className="text-meta tracking-wider text-white/40 uppercase">{match.court}</p>
                                </div>
                                {match.status === 'live' ? <LiveBadge /> : <StatusBadge status={match.status} />}
                            </div>

                            {match.status === 'live' ? (
                                <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                                    <p className="text-label truncate text-white/70">{match.home}</p>
                                    <span className="text-meta text-white/30">vs</span>
                                    <p className="text-label truncate text-right text-white/70">{match.away}</p>

                                    <Score value={match.score[0]} highlight={match.score[0] >= match.score[1]} />
                                    <span className="text-meta text-white/25">-</span>
                                    <Score value={match.score[1]} highlight={match.score[1] > match.score[0]} align="right" />
                                </div>
                            ) : (
                                <div className="mt-6">
                                    <p className="text-h2 text-white">{match.home}</p>
                                    <p className="text-label mt-1 text-white/55">{match.away}</p>
                                </div>
                            )}
                        </motion.article>
                    ))}
                </div>
            </div>
        </MarketingSection>
    );
}

function Score({ value, highlight, align = 'left' }: { value: number; highlight: boolean; align?: 'left' | 'right' }) {
    return (
        <motion.span
            key={value}
            initial={{ opacity: 0.4, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            data-numeric
            className={cn(
                'text-[2.5rem] leading-none font-black tracking-tight',
                highlight ? 'text-primary' : 'text-white/85',
                align === 'right' && 'text-right',
            )}
        >
            {value}
        </motion.span>
    );
}

/* ========================================================================== */
/* SECTION 6, Global rankings                                                */
/* ========================================================================== */

const scopes = ['Global', 'City', 'Organization', 'Branch'] as const;
type Scope = (typeof scopes)[number];

const leaderboards: Record<Scope, { rank: number; name: string; club: string; rating: number; matches: number; trend: number }[]> = {
    Global: [
        { rank: 1, name: 'M. Santos', club: 'Connected club', rating: 5.42, matches: 218, trend: 2 },
        { rank: 2, name: 'J. Tan', club: 'Connected club', rating: 5.31, matches: 194, trend: -1 },
        { rank: 3, name: 'A. Cruz', club: 'Connected club', rating: 5.18, matches: 176, trend: 4 },
        { rank: 4, name: 'R. Villanueva', club: 'Connected club', rating: 5.02, matches: 158, trend: 0 },
        { rank: 5, name: 'K. Reyes', club: 'Connected club', rating: 4.94, matches: 203, trend: -2 },
    ],
    City: [
        { rank: 1, name: 'A. Cruz', club: 'Connected club', rating: 5.18, matches: 176, trend: 1 },
        { rank: 2, name: 'L. Ilagan', club: 'Connected club', rating: 4.77, matches: 141, trend: 3 },
        { rank: 3, name: 'D. Ong', club: 'Connected club', rating: 4.61, matches: 122, trend: -1 },
        { rank: 4, name: 'P. Chua', club: 'Connected club', rating: 4.48, matches: 118, trend: 0 },
        { rank: 5, name: 'S. Uy', club: 'Connected club', rating: 4.35, matches: 97, trend: 2 },
    ],
    Organization: [
        { rank: 1, name: 'A. Cruz', club: 'Main Branch', rating: 5.18, matches: 176, trend: 0 },
        { rank: 2, name: 'L. Ilagan', club: 'Main Branch', rating: 4.77, matches: 141, trend: 2 },
        { rank: 3, name: 'P. Chua', club: 'North Branch', rating: 4.48, matches: 118, trend: 1 },
        { rank: 4, name: 'G. Lim', club: 'North Branch', rating: 4.22, matches: 88, trend: -3 },
        { rank: 5, name: 'F. Ramos', club: 'Main Branch', rating: 4.09, matches: 74, trend: 1 },
    ],
    Branch: [
        { rank: 1, name: 'A. Cruz', club: 'Court 01 regular', rating: 5.18, matches: 96, trend: 0 },
        { rank: 2, name: 'L. Ilagan', club: 'Court 03 regular', rating: 4.77, matches: 81, trend: 1 },
        { rank: 3, name: 'F. Ramos', club: 'Court 02 regular', rating: 4.09, matches: 52, trend: 2 },
        { rank: 4, name: 'B. Dizon', club: 'Court 01 regular', rating: 3.94, matches: 47, trend: -1 },
        { rank: 5, name: 'N. Abad', club: 'Court 04 regular', rating: 3.71, matches: 38, trend: 0 },
    ],
};

export function SectionRankings() {
    const reduce = useReducedMotion();
    const [scope, setScope] = useState<Scope>('Global');
    const rows = leaderboards[scope];

    return (
        <MarketingSection
            id="rankings"
            eyebrow="Section 06 · Rankings"
            title="Standings that mean the same thing everywhere."
            description="One rating engine across the network. Filter down from global to a single branch without the numbers changing meaning."
        >
            <div role="tablist" aria-label="Ranking scope" className="border-border bg-surface inline-flex rounded-lg border p-1">
                {scopes.map((item) => (
                    <button
                        key={item}
                        role="tab"
                        type="button"
                        aria-selected={scope === item}
                        onClick={() => setScope(item)}
                        className={cn(
                            'text-label relative rounded-md px-4 py-2 font-medium transition-colors',
                            scope === item ? 'text-primary-foreground' : 'text-secondary hover:text-foreground',
                        )}
                    >
                        {scope === item && (
                            <motion.span
                                layoutId="ranking-scope"
                                className="bg-primary absolute inset-0 rounded-md"
                                transition={reduce ? { duration: 0.01 } : { type: 'spring', stiffness: 320, damping: 32 }}
                            />
                        )}
                        <span className="relative">{item}</span>
                    </button>
                ))}
            </div>

            <div className="border-border bg-surface mt-6 overflow-hidden rounded-xl border">
                {rows.map((row, index) => (
                    <motion.div
                        key={`${scope}-${row.name}`}
                        layout={!reduce}
                        initial={reduce ? { opacity: 0 } : { opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: reduce ? 0.01 : 0.3, delay: reduce ? 0 : index * 0.05, ease: EASE }}
                        className={cn('flex items-center gap-4 px-4 py-4 sm:px-5', index > 0 && 'border-border border-t')}
                    >
                        <span
                            data-numeric
                            className={cn(
                                'text-label flex size-9 shrink-0 items-center justify-center rounded-lg font-bold',
                                row.rank === 1 ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-secondary',
                            )}
                        >
                            {row.rank}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-label text-foreground truncate font-semibold">{row.name}</p>
                            <p className="text-meta text-muted truncate">{row.club}</p>
                        </div>
                        <div className="hidden text-right sm:block">
                            <p data-numeric className="text-label text-secondary">
                                {row.matches}
                            </p>
                            <p className="text-meta text-muted">matches</p>
                        </div>
                        <div className="w-16 text-right">
                            <p data-numeric className="text-h3 text-foreground">
                                {row.rating.toFixed(2)}
                            </p>
                            <p
                                data-numeric
                                className={cn('text-meta font-medium', row.trend > 0 ? 'text-success' : row.trend < 0 ? 'text-danger' : 'text-muted')}
                            >
                                {row.trend > 0 ? `▲ ${row.trend}` : row.trend < 0 ? `▼ ${Math.abs(row.trend)}` : '-'}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </MarketingSection>
    );
}
