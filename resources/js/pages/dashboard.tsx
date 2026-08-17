import { ChartPanel, ChartTooltip, axisTick, gridProps } from '@/components/chart-kit';
import { EmptyState } from '@/components/empty-state';
import { MetricBand, Section, Stat } from '@/components/layout-primitives';
import { LiveBadge, StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { currency, currencyCompact } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CalendarClock, CreditCard, RadioTower, Trophy } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

/* eslint-disable @typescript-eslint/no-explicit-any -- payload shapes come from
   existing Laravel controllers and are typed there, not here. */
type Props = {
    mode: 'superadmin' | 'tenant' | 'front_desk' | 'cashier' | 'sports' | 'player';
    role?: string;
    title?: string;
    subtitle?: string;
    organization?: { name: string; currency: string };
    metrics: Record<string, number>;
    chartData: { label: string; revenue: number; reservations: number; occupancy: number }[];
    courtsNow?: any[];
    reservations?: any[];
    demoRequests?: any[];
    transactions?: any[];
    openSession?: any;
    matches?: any[];
    playerProfile?: any;
};

const metricLabels: Record<string, string> = {
    revenueToday: 'Revenue today',
    reservationsToday: 'Reservations today',
    activeCourts: 'Active courts',
    courtOccupancy: 'Court occupancy',
    playersCheckedIn: 'Players on-site',
    openPlayPlayers: 'Open play players',
    posSales: 'POS sales',
    outstandingBalances: 'Outstanding',
    organizations: 'Organizations',
    activeSubscriptions: 'Active subscriptions',
    trialOrganizations: 'Trials',
    demoRequests: 'Demo requests',
    branches: 'Branches',
    courts: 'Courts',
    players: 'Players',
    globalPlayers: 'Global players',
    mrr: 'MRR',
    pendingCheckIns: 'Pending check-ins',
    availableCourts: 'Available courts',
    liveCourts: 'Live courts',
    cashPayments: 'Cash payments',
    digitalPayments: 'Digital payments',
    transactionsToday: 'Transactions today',
    openCashierSessions: 'Open tills',
    lowStock: 'Low stock',
    liveMatches: 'Live matches',
    completedMatchesToday: 'Completed today',
    openPlaySessions: 'Open play sessions',
    rankedPlayers: 'Ranked players',
    globalRating: 'Global rating',
    globalMatches: 'Global matches',
    wins: 'Wins',
    losses: 'Losses',
    connectedClubs: 'Connected clubs',
};

const moneyKeys = ['revenue', 'sales', 'balances', 'mrr', 'payments'];

export default function Dashboard({
    mode,
    role,
    title,
    subtitle,
    organization,
    metrics,
    chartData,
    courtsNow = [],
    reservations = [],
    demoRequests = [],
    transactions = [],
    openSession,
    matches = [],
    playerProfile,
}: Props) {
    /* One instrument band, not eight cards. Five is the readable maximum. */
    const bandMetrics = Object.entries(metrics).slice(0, 5);
    const overflowMetrics = Object.entries(metrics).slice(5, 9);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard | EAJ CourtPrime" />

            <div className="space-y-8 p-4 md:p-6">
                {/* Context bar, no card, just hierarchy. */}
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="min-w-0">
                        <p className="text-eyebrow text-muted uppercase">
                            {mode === 'superadmin' ? 'CourtPrime platform' : (organization?.name ?? roleLabel(role))}
                        </p>
                        <h1 className="text-h1 text-foreground mt-1.5">{title ?? 'Dashboard'}</h1>
                        <p className="text-label text-secondary mt-2 max-w-2xl">{decodeText(subtitle)}</p>
                    </div>
                    <QuickActions mode={mode} />
                </div>

                {bandMetrics.length > 0 && (
                    <MetricBand>
                        {bandMetrics.map(([key, value], index) => (
                            <Stat
                                key={key}
                                label={metricLabels[key] ?? key}
                                value={formatMetric(key, value)}
                                tone={index === 0 ? 'primary' : 'default'}
                            />
                        ))}
                    </MetricBand>
                )}

                {overflowMetrics.length > 0 && (
                    <dl className="flex flex-wrap gap-x-8 gap-y-3">
                        {overflowMetrics.map(([key, value]) => (
                            <div key={key} className="flex items-baseline gap-2">
                                <dt className="text-label text-muted">{metricLabels[key] ?? key}</dt>
                                <dd data-numeric className="text-label text-foreground font-semibold">
                                    {formatMetric(key, value)}
                                </dd>
                            </div>
                        ))}
                    </dl>
                )}

                {mode !== 'player' && (
                    <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
                        <RevenueChart chartData={chartData} />
                        {mode === 'cashier' ? (
                            <TillPanel openSession={openSession} transactions={transactions} />
                        ) : mode === 'sports' ? (
                            <CompetitionPanel matches={matches} courtsNow={courtsNow} />
                        ) : (
                            <OperationsPanel mode={mode} demoRequests={demoRequests} courtsNow={courtsNow} />
                        )}
                    </div>
                )}

                {mode !== 'player' && chartData.length > 0 && (
                    <div className="grid gap-5 md:grid-cols-2">
                        <ReservationsChart chartData={chartData} />
                        <OccupancyChart chartData={chartData} />
                    </div>
                )}

                {mode === 'player' && <PlayerSummary playerProfile={playerProfile} reservations={reservations} chartData={chartData} />}

                {['tenant', 'front_desk'].includes(mode) && (
                    <Section title="Today's reservation flow" description="Bookings moving through the desk right now.">
                        {reservations.length === 0 ? (
                            <EmptyState
                                title="No reservations today"
                                description="New bookings will appear here as the desk takes them."
                                artwork="/cp-paddle.png"
                                action={
                                    <Button asChild>
                                        <Link href="/reservations">New reservation</Link>
                                    </Button>
                                }
                            />
                        ) : (
                            <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-lg border">
                                {reservations.map((reservation: any) => (
                                    <li key={reservation.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-label text-foreground truncate font-medium">{reservation.reference}</p>
                                            <p className="text-meta text-muted truncate">{reservation.player?.name ?? 'Walk-in player'}</p>
                                        </div>
                                        <span className="text-meta text-secondary">{reservation.court?.name}</span>
                                        <StatusBadge status={reservation.booking_status} />
                                        <span data-numeric className="text-label text-foreground w-24 text-right font-semibold">
                                            {currency(reservation.amount_due)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Section>
                )}
            </div>
        </AppLayout>
    );
}

/* -------------------------------------------------------------------------- */
/* Charts, one measure per axis, always                                       */
/* -------------------------------------------------------------------------- */

function RevenueChart({ chartData }: { chartData: Props['chartData'] }) {
    const latest = chartData.at(-1)?.revenue ?? 0;

    return (
        <ChartPanel title="Revenue" description="Collected per period" headline={currencyCompact(latest)}>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                        <linearGradient id="cp-dash-revenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} dy={6} />
                    <YAxis tick={axisTick} tickLine={false} axisLine={false} width={52} tickFormatter={(value) => currencyCompact(value)} />
                    <Tooltip
                        cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
                        content={<ChartTooltip formatter={(value) => currency(value)} />}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        fill="url(#cp-dash-revenue)"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </ChartPanel>
    );
}

/* Reservations were previously plotted on the same axis as revenue, where a
   value of ~1,500 sat flat against ~900,000. Separate charts, separate scales. */
function ReservationsChart({ chartData }: { chartData: Props['chartData'] }) {
    return (
        <ChartPanel title="Reservations" description="Booked sessions per period" headline={(chartData.at(-1)?.reservations ?? 0).toLocaleString()}>
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} dy={6} />
                    <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} />
                    <Tooltip cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }} content={<ChartTooltip />} />
                    <Line
                        type="monotone"
                        dataKey="reservations"
                        name="Reservations"
                        stroke="var(--chart-3)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </ChartPanel>
    );
}

function OccupancyChart({ chartData }: { chartData: Props['chartData'] }) {
    return (
        <ChartPanel title="Court occupancy" description="Share of court hours used" headline={`${chartData.at(-1)?.occupancy ?? 0}%`}>
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                        <linearGradient id="cp-dash-occupancy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.24} />
                            <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} dy={6} />
                    <YAxis tick={axisTick} tickLine={false} axisLine={false} width={40} unit="%" domain={[0, 100]} />
                    <Tooltip
                        cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
                        content={<ChartTooltip formatter={(value) => `${value}%`} />}
                    />
                    <Area
                        type="monotone"
                        dataKey="occupancy"
                        name="Occupancy"
                        stroke="var(--chart-2)"
                        strokeWidth={2}
                        fill="url(#cp-dash-occupancy)"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </ChartPanel>
    );
}

/* -------------------------------------------------------------------------- */
/* Side panels                                                                 */
/* -------------------------------------------------------------------------- */

function PanelShell({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <section className="border-border bg-surface flex flex-col overflow-hidden rounded-lg border">
            <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
                <h3 className="text-h3 text-foreground">{title}</h3>
                {action}
            </div>
            <div className="divide-border flex-1 divide-y">{children}</div>
        </section>
    );
}

function OperationsPanel({ mode, demoRequests, courtsNow }: { mode: Props['mode']; demoRequests: any[]; courtsNow: any[] }) {
    if (mode === 'superadmin') {
        return (
            <PanelShell
                title="New demo pipeline"
                action={
                    <Link href="/demo-pipeline" className="text-meta text-primary font-medium hover:underline">
                        View all
                    </Link>
                }
            >
                {demoRequests.length === 0 ? (
                    <p className="text-label text-muted px-5 py-8 text-center">No new demo requests.</p>
                ) : (
                    demoRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                            <div className="min-w-0">
                                <p className="text-label text-foreground truncate font-medium">{request.business_name}</p>
                                <p className="text-meta text-muted truncate">{request.reference}</p>
                            </div>
                            <StatusBadge status={request.status} />
                        </div>
                    ))
                )}
            </PanelShell>
        );
    }

    return (
        <PanelShell
            title="Live operations"
            action={
                <Link href="/live-courts" className="text-meta text-primary font-medium hover:underline">
                    All courts
                </Link>
            }
        >
            {courtsNow.length === 0 ? (
                <p className="text-label text-muted px-5 py-8 text-center">No courts configured yet.</p>
            ) : (
                courtsNow.slice(0, 6).map((court) => <CourtRow key={court.id} court={court} match={court.matches?.[0]} />)
            )}
        </PanelShell>
    );
}

function TillPanel({ openSession, transactions }: { openSession?: any; transactions: any[] }) {
    return (
        <PanelShell
            title="Till & transactions"
            action={
                <Link href="/pos" className="text-meta text-primary font-medium hover:underline">
                    Open POS
                </Link>
            }
        >
            <div className="bg-surface-muted flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                    <p className="text-label text-foreground truncate font-medium">{openSession ? openSession.reference : 'No open till'}</p>
                    <p className="text-meta text-muted truncate">{openSession?.branch?.name ?? 'Open a cashier session to sell'}</p>
                </div>
                <StatusBadge status={openSession ? 'active' : 'pending'} label={openSession ? 'open' : 'closed'} />
            </div>
            {transactions.slice(0, 6).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                        <p className="text-label text-foreground truncate font-medium">{transaction.reference}</p>
                        <p className="text-meta text-muted truncate">{transaction.branch?.name}</p>
                    </div>
                    <span data-numeric className="text-label text-foreground font-semibold">
                        {currency(transaction.total_amount)}
                    </span>
                </div>
            ))}
        </PanelShell>
    );
}

function CompetitionPanel({ matches, courtsNow }: { matches: any[]; courtsNow: any[] }) {
    return (
        <PanelShell
            title="Live competition"
            action={
                <Link href="/matches" className="text-meta text-primary font-medium hover:underline">
                    All matches
                </Link>
            }
        >
            {matches.slice(0, 5).map((match) => (
                <div key={match.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                        <p className="text-label text-foreground truncate font-medium">
                            {match.team_one_name} vs {match.team_two_name}
                        </p>
                        <p className="text-meta text-muted truncate">{match.court?.name}</p>
                    </div>
                    <span data-numeric className="text-h3 text-primary shrink-0">
                        {match.team_one_score} - {match.team_two_score}
                    </span>
                </div>
            ))}
            {matches.length === 0 && courtsNow.slice(0, 4).map((court) => <CourtRow key={court.id} court={court} match={court.matches?.[0]} />)}
            {matches.length === 0 && courtsNow.length === 0 && (
                <p className="text-label text-muted px-5 py-8 text-center">Nothing in play right now.</p>
            )}
        </PanelShell>
    );
}

function CourtRow({ court, match }: { court: any; match?: any }) {
    const live = Boolean(match);

    return (
        <div className={cn('flex items-center justify-between gap-3 px-4 py-3 sm:px-5', live && 'bg-live-soft/40')}>
            <div className="min-w-0">
                <p className="text-label text-foreground truncate font-medium">{court.name}</p>
                <p className="text-meta text-muted truncate">
                    {live ? `${match.team_one_name} vs ${match.team_two_name}` : (court.branch?.name ?? 'Ready for the next booking')}
                </p>
            </div>
            {live ? (
                <span className="flex shrink-0 items-center gap-3">
                    <span data-numeric className="text-h3 text-primary">
                        {match.team_one_score} - {match.team_two_score}
                    </span>
                    <LiveBadge />
                </span>
            ) : (
                <StatusBadge status={court.status} />
            )}
        </div>
    );
}

function PlayerSummary({ playerProfile, reservations, chartData }: { playerProfile?: any; reservations: any[]; chartData: Props['chartData'] }) {
    return (
        <div className="space-y-6">
            <div className="border-border bg-surface-deep text-surface-deep-foreground rounded-lg border p-5">
                <p className="text-eyebrow text-white/45 uppercase">CourtPrime identity</p>
                <p className="text-h1 mt-2 text-white">{playerProfile?.display_name ?? 'CourtPrime Player'}</p>
                <p data-numeric className="text-label text-primary mt-1">
                    {playerProfile?.courtprime_player_id ?? 'Profile not claimed yet'}
                </p>
                <div className="mt-6 flex gap-8">
                    <div>
                        <p className="text-meta tracking-wide text-white/45 uppercase">Rating</p>
                        <p data-numeric className="text-kpi mt-1 text-white">
                            {playerProfile?.global_rating ?? '2.50'}
                        </p>
                    </div>
                    <div>
                        <p className="text-meta tracking-wide text-white/45 uppercase">Matches</p>
                        <p data-numeric className="text-kpi mt-1 text-white">
                            {playerProfile?.global_match_count ?? 0}
                        </p>
                    </div>
                </div>
            </div>

            {chartData.length > 0 && <ReservationsChart chartData={chartData} />}

            <Section title="Upcoming activity">
                {reservations.length === 0 ? (
                    <EmptyState
                        title="Nothing booked yet"
                        description="Find a connected club and reserve your next court."
                        artwork="/cp-paddle.png"
                        action={
                            <Button asChild>
                                <Link href="/me/book">Book a court</Link>
                            </Button>
                        }
                    />
                ) : (
                    <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-lg border">
                        {reservations.map((reservation: any) => (
                            <li key={reservation.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                <div className="min-w-0">
                                    <p className="text-label text-foreground truncate font-medium">{reservation.reference}</p>
                                    <p className="text-meta text-muted truncate">{reservation.court?.name}</p>
                                </div>
                                <StatusBadge status={reservation.booking_status} />
                            </li>
                        ))}
                    </ul>
                )}
            </Section>
        </div>
    );
}

/* -------------------------------------------------------------------------- */

function QuickActions({ mode }: { mode: Props['mode'] }) {
    const actions =
        mode === 'cashier'
            ? ([
                  ['/pos', CreditCard, 'Open POS'],
                  ['/cashier-sessions', CreditCard, 'Till sessions'],
              ] as const)
            : mode === 'sports'
              ? ([
                    ['/matches', Trophy, 'Live matches'],
                    ['/live-courts', RadioTower, 'Live courts'],
                ] as const)
              : mode === 'player'
                ? ([
                      ['/me/book', CalendarClock, 'Book a court'],
                      ['/rankings', Trophy, 'Rankings'],
                  ] as const)
                : ([
                      ['/reservations', CalendarClock, 'New reservation'],
                      ['/live-courts', RadioTower, 'Live courts'],
                  ] as const);

    return (
        <div className="flex shrink-0 flex-wrap gap-2">
            {actions.map(([href, Icon, label], index) => (
                <Button key={href} asChild variant={index === 0 ? 'default' : 'outline'}>
                    <Link href={href}>
                        <Icon className="size-4" />
                        {label}
                    </Link>
                </Button>
            ))}
        </div>
    );
}

function formatMetric(key: string, value: number) {
    const lower = key.toLowerCase();

    if (moneyKeys.some((item) => lower.includes(item))) {
        return currency(value);
    }

    if (lower.includes('occupancy')) {
        return `${value}%`;
    }

    if (lower.includes('rating')) {
        return Number(value).toFixed(2);
    }

    return value.toLocaleString();
}

function roleLabel(role?: string) {
    return role ? role.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'CourtPrime workspace';
}

function decodeText(value?: string) {
    return value?.replaceAll('&apos;', "'") ?? 'One secure sign-in. The right CourtPrime experience for every user.';
}
