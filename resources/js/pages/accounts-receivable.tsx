import { CurrencyDisplay } from '@/components/currency-display';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { currency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { CircleDollarSign, ClockAlert, ReceiptText } from 'lucide-react';
import { type FormEvent, type ReactNode } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Receivables', href: '/accounts-receivable' }];
const categories = ['reservation', 'membership', 'tournament', 'coaching', 'pos', 'other'];

export default function AccountsReceivable({
    receivables,
    branches,
    players,
    reservations,
    metrics,
}: {
    receivables: any;
    branches: any[];
    players: any[];
    reservations: any[];
    metrics: Record<string, number>;
}) {
    const form = useForm({
        branch_id: branches.length === 1 ? branches[0].id : '',
        organization_player_id: '',
        reservation_id: '',
        customer_name: '',
        category: 'reservation',
        amount_due: 0,
        due_date: new Date().toISOString().slice(0, 10),
        notes: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            branch_id: data.branch_id ? Number(data.branch_id) : null,
            organization_player_id: data.organization_player_id ? Number(data.organization_player_id) : null,
            reservation_id: data.reservation_id ? Number(data.reservation_id) : null,
            amount_due: Number(data.amount_due),
        })).post('/accounts-receivable', { preserveScroll: true, onSuccess: () => form.reset('customer_name', 'amount_due', 'notes') });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Receivables" />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    icon={ReceiptText}
                    title="Receivables"
                    description="Track CourtPrime customer balances, overdue items, and partial collections without mixing tenant finance data across clubs."
                />
            </div>
            <div className="grid gap-6 px-4 pb-4 md:px-6 md:pb-6 xl:grid-cols-[0.95fr_1.5fr]">
                <div className="space-y-6">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <StatsCard label="Open Balance" value={<CurrencyDisplay value={metrics.open} />} icon={ReceiptText} />
                        <StatsCard label="Overdue" value={<CurrencyDisplay value={metrics.overdue} />} icon={ClockAlert} />
                        <StatsCard label="Settled Month" value={<CurrencyDisplay value={metrics.settledMonth} />} icon={CircleDollarSign} />
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ReceiptText className="size-4 text-pink-600" />
                                New Receivable
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Select
                                        label="Branch"
                                        value={String(form.data.branch_id)}
                                        options={['', ...branches.map((branch) => String(branch.id))]}
                                        labels={Object.fromEntries([
                                            ['', 'Organization-wide'],
                                            ...branches.map((branch) => [String(branch.id), `${branch.code} - ${branch.name}`]),
                                        ])}
                                        onChange={(value) => form.setData('branch_id', value)}
                                    />
                                    <Select
                                        label="Category"
                                        value={form.data.category}
                                        options={categories}
                                        onChange={(value) => form.setData('category', value)}
                                    />
                                    <Select
                                        label="Player"
                                        value={String(form.data.organization_player_id)}
                                        options={['', ...players.map((player) => String(player.id))]}
                                        labels={Object.fromEntries([
                                            ['', 'Unlinked'],
                                            ...players.map((player) => [
                                                String(player.id),
                                                `${player.player_profile?.display_name} (${player.player_profile?.courtprime_player_id})`,
                                            ]),
                                        ])}
                                        onChange={(value) => form.setData('organization_player_id', value)}
                                    />
                                    <Select
                                        label="Reservation"
                                        value={String(form.data.reservation_id)}
                                        options={['', ...reservations.map((reservation) => String(reservation.id))]}
                                        labels={Object.fromEntries([
                                            ['', 'No reservation'],
                                            ...reservations.map((reservation) => [
                                                String(reservation.id),
                                                `${reservation.reference} - ${currency(reservation.amount_due)}`,
                                            ]),
                                        ])}
                                        onChange={(value) => form.setData('reservation_id', value)}
                                    />
                                    <Field
                                        label="Customer Name"
                                        value={form.data.customer_name}
                                        onChange={(value) => form.setData('customer_name', value)}
                                        error={form.errors.customer_name}
                                    />
                                    <Field
                                        label="Amount Due"
                                        type="number"
                                        value={form.data.amount_due}
                                        onChange={(value) => form.setData('amount_due', Number(value))}
                                        error={form.errors.amount_due}
                                    />
                                    <Field
                                        label="Due Date"
                                        type="date"
                                        value={form.data.due_date}
                                        onChange={(value) => form.setData('due_date', value)}
                                        error={form.errors.due_date}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <textarea
                                        className="bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
                                        value={form.data.notes}
                                        onChange={(event) => form.setData('notes', event.target.value)}
                                    />
                                </div>
                                <Button disabled={form.processing}>Record Receivable</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Receivables Ledger</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {receivables.data.map((receivable: any) => (
                            <ReceivableCard key={receivable.id} receivable={receivable} />
                        ))}
                        {receivables.data.length === 0 && (
                            <EmptyState
                                icon={ReceiptText}
                                title="No receivables recorded yet"
                                description="Outstanding balances will appear here when staff records customer credit, partial payments, or reservation balances."
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function ReceivableCard({ receivable }: { receivable: any }) {
    const form = useForm({ amount: receivable.balance ?? 0 });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({ amount: Number(data.amount) })).post(`/accounts-receivable/${receivable.id}/payments`, { preserveScroll: true });
    };

    return (
        <div className="rounded-lg border p-3">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                    <p className="font-semibold">{receivable.reference}</p>
                    <p className="text-muted-foreground text-sm">
                        {receivable.customer_name} - {receivable.branch?.name ?? 'Organization-wide'}
                    </p>
                </div>
                <StatusBadge status={receivable.status} />
                <strong className="text-right">
                    <CurrencyDisplay value={receivable.balance} />
                </strong>
            </div>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                <Info label="Category" value={receivable.category} />
                <Info label="Amount Due" value={<CurrencyDisplay value={receivable.amount_due} />} />
                <Info label="Paid" value={<CurrencyDisplay value={receivable.amount_paid} />} />
            </div>
            {receivable.balance > 0 && (
                <form onSubmit={submit} className="bg-surface-muted/40 mt-3 grid gap-3 rounded-lg p-3 md:grid-cols-[1fr_auto] md:items-end">
                    <Field
                        label="Payment Amount"
                        type="number"
                        value={form.data.amount}
                        onChange={(value) => form.setData('amount', Number(value))}
                        error={form.errors.amount}
                    />
                    <Button disabled={form.processing}>Record Payment</Button>
                </form>
            )}
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    error,
    type = 'text',
}: {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    error?: string;
    type?: string;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Input type={type} step={type === 'number' ? '0.01' : undefined} value={value} onChange={(event) => onChange(event.target.value)} />
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}

function Select({
    label,
    value,
    options,
    labels,
    onChange,
}: {
    label: string;
    value: string;
    options: string[];
    labels?: Record<string, string>;
    onChange: (value: string) => void;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <select
                className="bg-background h-10 w-full rounded-md border px-3 text-sm capitalize"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                {options.map((option) => (
                    <option key={option || 'none'} value={option}>
                        {labels?.[option] ?? option.replaceAll('_', ' ')}
                    </option>
                ))}
            </select>
        </div>
    );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-1 font-semibold capitalize">{value}</p>
        </div>
    );
}
