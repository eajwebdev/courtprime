import { ChartTooltip, axisTick, gridProps } from '@/components/chart-kit';
import { MarketingSection } from '@/components/marketing/marketing-section';
import { useReveal } from '@/lib/motion';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
/* Every chart here is single-series, so no legend box is needed, each title
   names its own series. See the dataviz skill. */
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

/* ========================================================================== */
/* SECTION 9, Analytics                                                      */
/* ========================================================================== */

const revenueData = [
    { month: 'Mar', revenue: 742000, reservations: 1180 },
    { month: 'Apr', revenue: 811000, reservations: 1265 },
    { month: 'May', revenue: 903000, reservations: 1402 },
    { month: 'Jun', revenue: 968000, reservations: 1488 },
    { month: 'Jul', revenue: 1104000, reservations: 1631 },
    { month: 'Aug', revenue: 1243000, reservations: 1794 },
];

const peakHours = [
    { hour: '6a', utilisation: 22 },
    { hour: '9a', utilisation: 41 },
    { hour: '12p', utilisation: 38 },
    { hour: '3p', utilisation: 54 },
    { hour: '6p', utilisation: 92 },
    { hour: '9p', utilisation: 76 },
];

const branches = [
    { branch: 'Main', occupancy: 88 },
    { branch: 'North', occupancy: 74 },
    { branch: 'Seaside', occupancy: 61 },
    { branch: 'Uptown', occupancy: 47 },
];

export function SectionAnalytics() {
    const reveal = useReveal();

    return (
        <MarketingSection
            id="analytics"
            eyebrow="Section 09 · Analytics"
            title="The numbers a club owner actually runs on."
            description="Revenue, occupancy, peak demand and branch comparison, measured the same way across every location you operate."
        >
            <motion.div {...reveal} className="grid gap-5 lg:grid-cols-3">
                {/* Revenue, single series, so no legend box; the title names it. */}
                <div className="border-border bg-surface rounded-xl border lg:col-span-2">
                    <div className="border-border flex flex-wrap items-baseline justify-between gap-3 border-b px-5 py-4">
                        <div>
                            <h3 className="text-h3 text-foreground">Revenue</h3>
                            <p className="text-meta text-muted">Last 6 months · all branches</p>
                        </div>
                        <p data-numeric className="text-h2 text-foreground">
                            ₱1.24M
                            <span className="text-label text-success ml-2 font-medium">▲ 12.6%</span>
                        </p>
                    </div>
                    <div className="p-2 sm:p-4">
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={revenueData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                                <defs>
                                    <linearGradient id="cp-revenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid {...gridProps} />
                                <XAxis dataKey="month" tick={axisTick} tickLine={false} axisLine={false} dy={6} />
                                <YAxis
                                    tick={axisTick}
                                    tickLine={false}
                                    axisLine={false}
                                    width={44}
                                    tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                                />
                                <Tooltip
                                    cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
                                    content={<ChartTooltip formatter={(value: number) => `₱${value.toLocaleString()}`} />}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    name="Revenue"
                                    stroke="var(--chart-1)"
                                    strokeWidth={2}
                                    fill="url(#cp-revenue)"
                                    dot={false}
                                    activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Occupancy by branch, bar, direct-labelled, single hue. */}
                <div className="border-border bg-surface rounded-xl border">
                    <div className="border-border border-b px-5 py-4">
                        <h3 className="text-h3 text-foreground">Occupancy by branch</h3>
                        <p className="text-meta text-muted">Court utilisation, August</p>
                    </div>
                    <div className="space-y-3 p-5">
                        {branches.map((item) => (
                            <div key={item.branch}>
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-label text-foreground">{item.branch}</span>
                                    <span data-numeric className="text-label text-foreground font-semibold">
                                        {item.occupancy}%
                                    </span>
                                </div>
                                <div className="bg-surface-muted mt-1.5 h-2 overflow-hidden rounded-full">
                                    <div className="h-full rounded-full" style={{ width: `${item.occupancy}%`, background: 'var(--chart-2)' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Peak hours, magnitude, one hue, highlight the answer. */}
                <div className="border-border bg-surface rounded-xl border">
                    <div className="border-border border-b px-5 py-4">
                        <h3 className="text-h3 text-foreground">Peak hours</h3>
                        <p className="text-meta text-muted">Average utilisation by time of day</p>
                    </div>
                    <div className="p-2 sm:p-4">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={peakHours} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                                <CartesianGrid {...gridProps} />
                                <XAxis dataKey="hour" tick={axisTick} tickLine={false} axisLine={false} dy={6} />
                                <YAxis tick={axisTick} tickLine={false} axisLine={false} width={32} unit="%" />
                                <Tooltip
                                    cursor={{ fill: 'var(--surface-muted)' }}
                                    content={<ChartTooltip formatter={(value: number) => `${value}%`} />}
                                />
                                <Bar dataKey="utilisation" name="Utilisation" radius={[4, 4, 0, 0]} maxBarSize={28}>
                                    {peakHours.map((entry) => (
                                        <Cell key={entry.hour} fill={entry.utilisation >= 90 ? 'var(--chart-1)' : 'var(--chart-2)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Reservations, second single-series chart, distinct hue. */}
                <div className="border-border bg-surface rounded-xl border lg:col-span-2">
                    <div className="border-border flex flex-wrap items-baseline justify-between gap-3 border-b px-5 py-4">
                        <div>
                            <h3 className="text-h3 text-foreground">Reservations</h3>
                            <p className="text-meta text-muted">Booked court sessions per month</p>
                        </div>
                        <p data-numeric className="text-h2 text-foreground">
                            1,794
                            <span className="text-label text-success ml-2 font-medium">▲ 10.0%</span>
                        </p>
                    </div>
                    <div className="p-2 sm:p-4">
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={revenueData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                                <CartesianGrid {...gridProps} />
                                <XAxis dataKey="month" tick={axisTick} tickLine={false} axisLine={false} dy={6} />
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
                    </div>
                </div>
            </motion.div>

            <p className="text-meta text-muted mt-4 flex items-center gap-2">
                <BarChart3 className="size-3.5 shrink-0" />
                Illustrative figures. Live dashboards read from your own organisation only.
            </p>
        </MarketingSection>
    );
}
