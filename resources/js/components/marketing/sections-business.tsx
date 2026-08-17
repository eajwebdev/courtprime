import { EquipmentArtwork } from '@/components/marketing-artwork';
import { MarketingSection } from '@/components/marketing/marketing-section';
import { StatusBadge } from '@/components/status-badge';
import { EASE, revealProps, useReveal } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'framer-motion';
import { Boxes, CalendarClock, CreditCard, IdCard, Lock, RadioTower, Trophy, Users, Wallet, type LucideIcon } from 'lucide-react';
import { useState } from 'react';

/* ========================================================================== */
/* SECTION 7, Transition to the Business OS                                  */
/* ========================================================================== */

export function SectionBusinessTransition() {
    const reveal = useReveal();

    return (
        <section className="content-defer bg-surface-deep text-surface-deep-foreground relative overflow-hidden py-24 sm:py-32">
            <EquipmentArtwork
                asset="/cp-paddle2.png"
                decorative
                width={1536}
                height={1024}
                sizes="100vw"
                className="pointer-events-none absolute inset-0 size-full object-cover opacity-25"
            />
            <div aria-hidden className="from-surface-deep via-surface-deep/85 to-surface-deep/40 absolute inset-0 bg-gradient-to-r" />

            <motion.div {...reveal} className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl">
                    <p className="text-eyebrow text-primary uppercase">Section 07 · For club owners</p>
                    <h2 className="mt-4 text-[2rem] leading-[1.1] font-semibold tracking-tight text-white sm:text-[2.75rem]">
                        Connect your courts to the player network while keeping your business operations private.
                    </h2>
                    <p className="text-body mt-6 max-w-xl text-white/65 sm:text-lg">
                        Players see one shared identity. You see your own books. Revenue, staffing, pricing, inventory and customer data stay inside
                        your organisation, tenant-isolated at the database level, not by convention.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                        {[
                            [Users, 'Shared', 'Player identity, ratings, rankings'],
                            [Lock, 'Private', 'Revenue, staff, pricing, customers'],
                        ].map(([Icon, label, detail]) => (
                            <div key={label as string} className="flex items-start gap-3">
                                {(() => {
                                    const Component = Icon as LucideIcon;
                                    return <Component className="text-primary mt-0.5 size-4 shrink-0" />;
                                })()}
                                <div>
                                    <p className="text-label font-semibold text-white">{label as string}</p>
                                    <p className="text-meta text-white/50">{detail as string}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </section>
    );
}

/* ========================================================================== */
/* SECTION 8, Business operating system                                      */
/* ========================================================================== */

type Module = {
    key: string;
    label: string;
    icon: LucideIcon;
    headline: string;
    copy: string;
    preview: { primary: string; primaryLabel: string; rows: [string, string, string][] };
};

const modules: Module[] = [
    {
        key: 'reservations',
        label: 'Reservations',
        icon: CalendarClock,
        headline: 'Every court, every slot, one grid.',
        copy: 'Drag-and-drop scheduling across branches with conflict detection and instant player lookup.',
        preview: {
            primary: '38',
            primaryLabel: 'Bookings today',
            rows: [
                ['Court 01 · 7:30 PM', 'Santos / Cruz', 'reserved'],
                ['Court 03 · 8:00 PM', 'Open play · 6 queued', 'open_play'],
                ['Court 04 · 8:30 PM', 'Reyes / Lim', 'confirmed'],
            ],
        },
    },
    {
        key: 'live',
        label: 'Live Courts',
        icon: RadioTower,
        headline: 'Know what every court is doing.',
        copy: 'Real-time occupancy, live scores and turnaround timing across every branch you operate.',
        preview: {
            primary: '6 / 8',
            primaryLabel: 'Courts in play',
            rows: [
                ['Court 01', '11 - 8 · game point', 'live'],
                ['Court 02', 'Available', 'available'],
                ['Court 05', 'Net repair', 'maintenance'],
            ],
        },
    },
    {
        key: 'pos',
        label: 'POS',
        icon: CreditCard,
        headline: 'A till built for a pro shop.',
        copy: 'Fast product search, paddle and ball rentals, shift reconciliation and player-linked tabs.',
        preview: {
            primary: '₱84,320',
            primaryLabel: 'Sales today',
            rows: [
                ['Paddle rental ×2', '₱180', 'paid'],
                ['Ball set', '₱240', 'paid'],
                ['Court 03 · 90 min', '₱750', 'pending'],
            ],
        },
    },
    {
        key: 'memberships',
        label: 'Memberships',
        icon: IdCard,
        headline: 'Recurring revenue you can see.',
        copy: 'Tiers, renewals, credits and expiry, with the churn signal surfaced before it happens.',
        preview: {
            primary: '412',
            primaryLabel: 'Active members',
            rows: [
                ['Premium annual', '128 members', 'active'],
                ['Standard monthly', '243 members', 'active'],
                ['Expiring in 14 days', '19 members', 'expiring'],
            ],
        },
    },
    {
        key: 'tournaments',
        label: 'Tournaments',
        icon: Trophy,
        headline: 'Brackets that run themselves.',
        copy: 'Registration, seeding, scheduling and live scoring feeding straight into network rankings.',
        preview: {
            primary: '24',
            primaryLabel: 'Teams registered',
            rows: [
                ['Mixed doubles 4.0', 'Round of 16', 'in_progress'],
                ['Mens doubles 3.5', 'Seeding complete', 'scheduled'],
                ['Womens singles', 'Registration open', 'open'],
            ],
        },
    },
    {
        key: 'inventory',
        label: 'Inventory',
        icon: Boxes,
        headline: 'Stock across every branch.',
        copy: 'Transfers, reorder points and shrinkage tracking for paddles, balls, apparel and consumables.',
        preview: {
            primary: '7',
            primaryLabel: 'Reorder alerts',
            rows: [
                ['Indoor balls (yellow)', '12 left', 'low_stock'],
                ['Grip tape', '48 left', 'in_stock'],
                ['Demo paddles', '0 left', 'out_of_stock'],
            ],
        },
    },
    {
        key: 'staff',
        label: 'Staff',
        icon: Users,
        headline: 'Roles, shifts and accountability.',
        copy: 'Front desk, cashier, scorekeeper and coach permissions scoped per branch.',
        preview: {
            primary: '11',
            primaryLabel: 'On shift',
            rows: [
                ['Front desk', '3 on duty', 'active'],
                ['Cashier', '2 sessions open', 'active'],
                ['Coaches', '4 booked', 'confirmed'],
            ],
        },
    },
    {
        key: 'finance',
        label: 'Finance',
        icon: Wallet,
        headline: 'Cash in, cash out, reconciled.',
        copy: 'Payments, receivables, expenses and cashier sessions closing cleanly at end of day.',
        preview: {
            primary: '₱1.24M',
            primaryLabel: 'Month to date',
            rows: [
                ['Collected', '₱1,186,400', 'paid'],
                ['Receivables', '₱53,600', 'pending'],
                ['Overdue', '₱12,900', 'overdue'],
            ],
        },
    },
];

export function SectionBusinessOS() {
    const reduce = useReducedMotion();
    const [active, setActive] = useState(0);
    const active_module = modules[active];

    return (
        <MarketingSection
            id="business"
            tone="muted"
            eyebrow="Section 08 · Business operating system"
            title="One system behind the counter."
            description="Nine modules that already share your players, your branches and your pricing, so nothing needs re-entering."
        >
            <div className="grid gap-8 lg:grid-cols-[18rem_1fr] lg:gap-10">
                <nav aria-label="Business modules" className="lg:sticky lg:top-24 lg:self-start">
                    <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
                        {modules.map((item, index) => {
                            const Icon = item.icon;
                            const isActive = index === active;
                            return (
                                <li key={item.key} className="shrink-0 lg:shrink">
                                    <button
                                        type="button"
                                        onClick={() => setActive(index)}
                                        aria-current={isActive ? 'true' : undefined}
                                        className={cn(
                                            'text-label flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-left font-medium whitespace-nowrap transition-colors duration-200',
                                            isActive
                                                ? 'bg-surface text-foreground shadow-e1'
                                                : 'text-secondary hover:bg-surface/60 hover:text-foreground',
                                        )}
                                    >
                                        <Icon className={cn('size-4 shrink-0', isActive ? 'text-primary' : 'text-muted')} />
                                        {item.label}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <motion.div
                    key={active_module.key}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduce ? 0.01 : 0.28, ease: EASE }}
                    className="border-border bg-surface overflow-hidden rounded-2xl border"
                >
                    <div className="border-border border-b p-6 sm:p-8">
                        <h3 className="text-h1 text-foreground">{active_module.headline}</h3>
                        <p className="text-body text-secondary mt-2 max-w-xl">{active_module.copy}</p>
                    </div>

                    <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:gap-10 sm:p-8">
                        <div>
                            <p className="text-meta text-muted tracking-wider uppercase">{active_module.preview.primaryLabel}</p>
                            <p data-numeric className="text-primary mt-2 text-[2.5rem] leading-none font-semibold tracking-tight">
                                {active_module.preview.primary}
                            </p>
                        </div>
                        <ul className="divide-border divide-y">
                            {active_module.preview.rows.map(([label, value, status], index) => (
                                <motion.li
                                    key={label}
                                    {...revealProps(reduce, { delay: index * 0.05, y: 10 })}
                                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <p className="text-label text-foreground truncate font-medium">{label}</p>
                                        <p className="text-meta text-muted truncate">{value}</p>
                                    </div>
                                    <StatusBadge status={status} />
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                </motion.div>
            </div>
        </MarketingSection>
    );
}
