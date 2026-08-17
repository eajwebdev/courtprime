import { CurrencyDisplay } from '@/components/currency-display';
import { DataTable, type DataTableColumn } from '@/components/data-table';
import { DateRangePicker } from '@/components/date-range-picker';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Activity, Download, Network, Printer, Users } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Reports', href: '/reports' }];

export default function Reports({
    filters,
    branches,
    courts,
    scope,
    metrics,
    networkMetrics,
    daily,
    courtUsage,
    heatmap,
    playerActivity,
}: {
    filters: any;
    branches: any[];
    courts: any[];
    scope: string;
    metrics: Record<string, number>;
    networkMetrics?: Record<string, number> | null;
    daily: any[];
    courtUsage: any[];
    heatmap: any[];
    playerActivity: any[];
}) {
    const playerColumns: DataTableColumn<any>[] = [
        {
            header: 'Player',
            cell: (player) => (
                <div>
                    <p className="font-semibold">{player.name}</p>
                    <p className="text-muted-foreground">{player.courtprime_player_id}</p>
                </div>
            ),
        },
        { header: 'Matches', cell: (player) => <span className="font-semibold">{player.matches}</span> },
        {
            header: 'Record',
            cell: (player) => (
                <span className="text-muted-foreground">
                    {player.wins}W / {player.losses}L
                </span>
            ),
            className: 'text-right',
        },
    ];

    const applyRange = (range: { start: string; end: string }) => {
        router.get('/reports', { ...filters, ...range }, { preserveState: true, preserveScroll: true });
    };
    const changeFilter = (key: 'branch_id' | 'court_id', value: string) => {
        router.get(
            '/reports',
            { ...filters, [key]: value || null, ...(key === 'branch_id' ? { court_id: null } : {}) },
            { preserveState: true, preserveScroll: true },
        );
    };
    const exportQuery = new URLSearchParams({
        start: filters.start,
        end: filters.end,
        export: 'csv',
        ...(filters.branch_id ? { branch_id: String(filters.branch_id) } : {}),
        ...(filters.court_id ? { court_id: String(filters.court_id) } : {}),
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <PageHeader
                        icon={Activity}
                        title="Reports & Analytics"
                        description={`Revenue, reservations, player flow, and court utilization for the active ${scope === 'network' ? 'CourtPrime network' : 'workspace'}.`}
                    />
                    <div className="flex flex-wrap items-end gap-2">
                        <DateRangePicker start={filters.start} end={filters.end} onApply={applyRange} />
                        <FilterSelect
                            label="Branch"
                            value={filters.branch_id ? String(filters.branch_id) : ''}
                            options={branches.map((branch) => ({ value: String(branch.id), label: `${branch.code} - ${branch.name}` }))}
                            emptyLabel={scope === 'network' ? 'All organizations' : 'All branches'}
                            onChange={(value) => changeFilter('branch_id', value)}
                        />
                        <FilterSelect
                            label="Court"
                            value={filters.court_id ? String(filters.court_id) : ''}
                            options={courts.map((court) => ({ value: String(court.id), label: `${court.branch?.code ?? 'BR'} - ${court.name}` }))}
                            emptyLabel="All courts"
                            onChange={(value) => changeFilter('court_id', value)}
                        />
                        <a
                            href={`/reports?${exportQuery.toString()}`}
                            className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium"
                        >
                            <Download className="size-4" />
                            CSV
                        </a>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium"
                        >
                            <Printer className="size-4" />
                            Print
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <StatsCard icon={Activity} label="Revenue" value={<CurrencyDisplay value={metrics.revenue} />} />
                    <StatsCard icon={Activity} label="Refunds" value={<CurrencyDisplay value={metrics.refunds} />} />
                    <StatsCard icon={Activity} label="Net Revenue" value={<CurrencyDisplay value={metrics.netRevenue} />} />
                    <StatsCard icon={Activity} label="Expenses" value={<CurrencyDisplay value={metrics.expenses} />} />
                    <StatsCard icon={Activity} label="Profit" value={<CurrencyDisplay value={metrics.profit} />} />
                    <StatsCard icon={Activity} label="Reservations" value={metrics.reservations} />
                    <StatsCard icon={Users} label="Player Visits" value={metrics.players} />
                    <StatsCard icon={Users} label="Active Players" value={metrics.activePlayers} />
                    <StatsCard icon={Activity} label="Avg Ticket" value={<CurrencyDisplay value={metrics.averageTicket} />} />
                </div>

                {networkMetrics && (
                    <div className="grid gap-4 md:grid-cols-4">
                        <StatsCard icon={Network} label="Organizations" value={networkMetrics.organizations} />
                        <StatsCard icon={Users} label="Global Players" value={networkMetrics.globalPlayers} />
                        <StatsCard icon={Activity} label="Connected Courts" value={networkMetrics.connectedCourts} />
                        <StatsCard icon={Activity} label="Network Reservations" value={networkMetrics.networkReservations} />
                    </div>
                )}

                <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Revenue, Expenses, and Reservations</CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={daily}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                                    <YAxis tickLine={false} axisLine={false} width={48} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="revenue" stroke="#E61B5B" fill="#E61B5B22" strokeWidth={2} />
                                    <Area type="monotone" dataKey="expenses" stroke="#F59E0B" fill="#F59E0B22" strokeWidth={2} />
                                    <Area type="monotone" dataKey="refunds" stroke="#64748B" fill="#64748B22" strokeWidth={2} />
                                    <Area type="monotone" dataKey="reservations" stroke="#1269E8" fill="#1269E822" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Court Usage Minutes</CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={courtUsage.slice(0, 8)} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                                    <XAxis type="number" tickLine={false} axisLine={false} />
                                    <YAxis dataKey="court" type="category" tickLine={false} axisLine={false} width={88} />
                                    <Tooltip />
                                    <Bar dataKey="minutes" fill="#E61B5B" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Court Heatmap Peaks</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2 sm:grid-cols-2">
                            {heatmap.map((slot) => (
                                <div key={slot.slot} className="rounded-lg border p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-semibold">{slot.slot}</p>
                                        <span className="rounded-full bg-pink-50 px-2 py-1 text-xs font-semibold text-pink-700">
                                            {slot.minutes} min
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground mt-2 text-sm">
                                        {slot.reservations} reservations - {slot.players} player visits
                                    </p>
                                </div>
                            ))}
                            {heatmap.length === 0 && (
                                <EmptyState
                                    icon={Activity}
                                    title="No heatmap data"
                                    description="Reservation heatmap peaks will appear after court activity is recorded for this date range."
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Player Activity Leaders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                rows={playerActivity}
                                columns={playerColumns}
                                rowKey={(player) => player.courtprime_player_id}
                                emptyIcon={Users}
                                emptyTitle="No player activity"
                                emptyDescription="Player activity leaders will appear after verified matches are recorded in this range."
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

function FilterSelect({
    label,
    value,
    options,
    emptyLabel,
    onChange,
}: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    emptyLabel: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>
            <select
                className="bg-background h-10 min-w-40 rounded-md border px-3 text-sm"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                <option value="">{emptyLabel}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
