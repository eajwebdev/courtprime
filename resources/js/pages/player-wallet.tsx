import { EmptyState } from '@/components/empty-state';
import { MetricBand, Section, Stat } from '@/components/layout-primitives';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { currency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CreditCard, MapPin, WalletCards } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payload from PlayerWalletController. */
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Home', href: '/me' },
    { title: 'Wallets', href: '/me/wallet' },
];

type Props = { profile: any; wallets: any[]; payments: any[]; posTransactions: any[] };

export default function PlayerWallet({ profile, wallets, payments, posTransactions }: Props) {
    const totalVisibleBalance = wallets.reduce((sum, wallet) => sum + Number(wallet.wallet_balance ?? 0), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Wallets | CourtPrime" />

            <div className="space-y-8">
                <div>
                    <p data-numeric className="text-eyebrow text-primary uppercase">
                        {profile.courtprime_player_id}
                    </p>
                    <h1 className="text-h1 text-foreground mt-1.5">Your wallets</h1>
                    <p className="text-label text-secondary mt-2 max-w-xl">
                        Each club keeps its own balance. Nothing is pooled across the network, so a top-up at one club stays there.
                    </p>
                </div>

                <MetricBand className="sm:grid-cols-3 lg:grid-cols-3">
                    <Stat label="Total balance" value={currency(totalVisibleBalance)} tone="primary" />
                    <Stat label="Connected wallets" value={wallets.length} />
                    <Stat label="Recent activity" value={payments.length + posTransactions.length} />
                </MetricBand>

                <Section title="Wallets by club">
                    {wallets.length === 0 ? (
                        <EmptyState
                            title="No wallets yet"
                            description="A wallet is created the first time you book or pay at a connected club."
                            artwork="/cp-paddle.png"
                            action={
                                <Button asChild>
                                    <Link href="/find-courts">Find a club</Link>
                                </Button>
                            }
                        />
                    ) : (
                        <ul className="grid gap-3 sm:grid-cols-2">
                            {wallets.map((wallet) => (
                                <li key={wallet.id} className="border-border bg-surface rounded-xl border p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-label text-foreground truncate font-semibold">{wallet.organization}</p>
                                            <p className="text-meta text-muted mt-0.5 flex items-center gap-1.5 truncate">
                                                <MapPin className="size-3 shrink-0" aria-hidden />
                                                {wallet.home_branch ?? 'No home branch'}
                                            </p>
                                        </div>
                                        <StatusBadge status={wallet.status} />
                                    </div>
                                    <p data-numeric className="text-kpi text-foreground mt-4">
                                        {currency(wallet.wallet_balance)}
                                    </p>
                                    <p data-numeric className="text-meta text-muted mt-1">
                                        Member {wallet.local_player_number}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>

                <Section title="Reservation payments">
                    <ActivityList
                        rows={payments}
                        amountKey="amount"
                        dateKey="paid_at"
                        methodKey="method"
                        icon={CreditCard}
                        empty="No reservation payments yet."
                    />
                </Section>

                <Section title="Pro shop purchases">
                    <ActivityList
                        rows={posTransactions}
                        amountKey="total_amount"
                        dateKey="created_at"
                        methodKey="payment_method"
                        icon={WalletCards}
                        empty="No purchases yet."
                    />
                </Section>
            </div>
        </AppLayout>
    );
}

function ActivityList({
    rows,
    amountKey,
    dateKey,
    methodKey,
    icon: Icon,
    empty,
}: {
    rows: any[];
    amountKey: string;
    dateKey: string;
    methodKey: string;
    icon: typeof CreditCard;
    empty: string;
}) {
    if (rows.length === 0) {
        return <p className="border-border text-label text-muted rounded-xl border border-dashed px-4 py-6 text-center">{empty}</p>;
    }

    return (
        <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-xl border">
            {rows.map((row) => (
                <li key={row.id} className="flex items-center gap-3 p-4">
                    <span className="bg-surface-muted text-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-label text-foreground truncate font-medium">{row.reference}</p>
                        <p className="text-meta text-muted truncate capitalize">
                            {row[dateKey] ?? 'Date pending'} · {String(row[methodKey] ?? '').replaceAll('_', ' ')}
                        </p>
                    </div>
                    <div className="shrink-0 text-right">
                        <p data-numeric className="text-label text-foreground font-semibold">
                            {currency(row[amountKey])}
                        </p>
                        <StatusBadge status={row.status} className="mt-1" />
                    </div>
                </li>
            ))}
        </ul>
    );
}
