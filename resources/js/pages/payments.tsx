import { ConfirmDialog } from '@/components/confirm-dialog';
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
import { Banknote, CreditCard, RotateCcw, WalletCards } from 'lucide-react';
import { type ReactNode } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Payments', href: '/payments' }];

export default function Payments({ payments, metrics }: { payments: any; metrics: Record<string, number> }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payments" />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    icon={WalletCards}
                    title="Payments"
                    description="Payment reconciliation across cash, digital wallets, cards, reservations, and POS."
                />
                <div className="grid gap-4 md:grid-cols-5">
                    <StatsCard icon={WalletCards} label="Today" value={<CurrencyDisplay value={metrics.today} />} />
                    <StatsCard icon={RotateCcw} label="Refunds" value={<CurrencyDisplay value={metrics.refunds} />} />
                    <StatsCard icon={WalletCards} label="Net" value={<CurrencyDisplay value={metrics.net} />} />
                    <StatsCard icon={Banknote} label="Cash" value={<CurrencyDisplay value={metrics.cash} />} />
                    <StatsCard icon={CreditCard} label="Digital" value={<CurrencyDisplay value={metrics.digital} />} />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Payment Ledger</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {payments.data.map((payment: any) => (
                            <PaymentRow key={payment.id} payment={payment} />
                        ))}
                        {payments.data.length === 0 && (
                            <EmptyState
                                icon={WalletCards}
                                title="No payments found"
                                description="Reservation and POS payments will appear here after they are recorded."
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function PaymentRow({ payment }: { payment: any }) {
    const refunded = Number(payment.refunded_amount ?? 0);
    const remaining = Math.max(0, Number(payment.amount) - refunded);
    const form = useForm({
        amount: remaining,
        reason: '',
    });

    const submitRefund = () => {
        form.transform((data) => ({ ...data, amount: Number(data.amount) }));
        form.post(`/payments/${payment.id}/refunds`, {
            preserveScroll: true,
            onSuccess: () => form.reset('reason'),
        });
    };

    return (
        <div className="rounded-lg border p-3">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                    <p className="font-semibold">{payment.reference}</p>
                    <p className="text-muted-foreground text-sm">
                        {payment.method} - {payment.transaction?.reference ?? 'Reservation payment'}
                    </p>
                </div>
                <StatusBadge status={payment.status} />
                <strong className="text-right">
                    <CurrencyDisplay value={payment.amount} />
                </strong>
            </div>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                <Info label="Refunded" value={<CurrencyDisplay value={refunded} />} />
                <Info label="Remaining" value={<CurrencyDisplay value={remaining} />} />
                <Info label="Recent Refunds" value={payment.refunds?.length ?? 0} />
            </div>
            {payment.refunds?.length > 0 && (
                <div className="text-muted-foreground mt-3 space-y-2 text-xs">
                    {payment.refunds.map((refund: any) => (
                        <p key={refund.id}>
                            {refund.reference} - {currency(refund.amount)} - {refund.reason}
                        </p>
                    ))}
                </div>
            )}
            {remaining > 0 && payment.status !== 'voided' && (
                <div className="bg-surface-muted/40 mt-3 grid gap-3 rounded-lg p-3 md:grid-cols-[0.5fr_1fr_auto] md:items-end">
                    <div className="space-y-2">
                        <Label>Refund Amount</Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={remaining}
                            value={form.data.amount}
                            onChange={(event) => form.setData('amount', Number(event.target.value))}
                        />
                        {form.errors.amount && <p className="text-xs text-red-600">{form.errors.amount}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Reason</Label>
                        <Input value={form.data.reason} onChange={(event) => form.setData('reason', event.target.value)} />
                        {form.errors.reason && <p className="text-xs text-red-600">{form.errors.reason}</p>}
                    </div>
                    <ConfirmDialog
                        title="Record this refund?"
                        description={`This will refund ${currency(form.data.amount)} from payment ${payment.reference}.`}
                        confirmLabel="Record Refund"
                        variant="destructive"
                        onConfirm={submitRefund}
                        trigger={
                            <Button type="button" disabled={form.processing}>
                                Record Refund
                            </Button>
                        }
                    />
                </div>
            )}
        </div>
    );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
        </div>
    );
}
