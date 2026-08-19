import { ConfirmDialog } from '@/components/confirm-dialog';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { currency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Building2, Check, CreditCard, Sparkles } from 'lucide-react';
import { type FormEvent, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payload from TenantSubscriptionController. */

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Tenant Subscriptions', href: '/tenant-subscriptions' }];

type Props = {
    organizations: any[];
    plans: any[];
    trialDays: number;
    canTakePayment: boolean;
};

export default function TenantSubscriptions({ organizations, plans, trialDays, canTakePayment }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tenant Subscriptions" />
            <div className="space-y-6 p-4 md:p-6">
                <div>
                    <p className="text-sm font-semibold text-pink-600">EAJ Superadmin</p>
                    <h1 className="mt-2 text-2xl font-semibold">Tenant Subscriptions</h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Start a club's trial, put it on a plan and term, and settle payments taken outside QRPh. A club sees what it owes and pays by
                        QRPh from its own billing page, it does not choose its own plan.
                    </p>
                </div>

                <div className="grid gap-4">
                    {organizations.map((organization) => (
                        <TenantSubscriptionCard
                            key={organization.id}
                            organization={organization}
                            plans={plans}
                            trialDays={trialDays}
                            canTakePayment={canTakePayment}
                        />
                    ))}
                    {organizations.length === 0 && (
                        <Card>
                            <CardContent className="text-muted-foreground p-6 text-sm">No organizations are available yet.</CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function TenantSubscriptionCard({
    organization,
    plans,
    trialDays,
    canTakePayment,
}: {
    organization: any;
    plans: any[];
    trialDays: number;
    canTakePayment: boolean;
}) {
    const subscription = organization.subscription;

    /* The new path: start a trial, or put the club on a plan and term. Kept
       separate from the manual override form below rather than merged into
       it, because the two write through different logic, this one rolls the
       period and raises the invoice the same way a real renewal does. */
    const [newPlanId, setNewPlanId] = useState<number | null>(plans[0]?.id ?? null);
    const [newMonths, setNewMonths] = useState(1);
    const newPlan = plans.find((entry) => Number(entry.id) === newPlanId) ?? plans[0] ?? null;
    const newTerm = newPlan?.terms?.find((entry: any) => entry.months === newMonths) ?? newPlan?.terms?.[0] ?? null;
    /* Moving an existing subscriber is worth saying out loud; a club with no
       plan yet is simply being put on one. */
    const changingPlan = Boolean(subscription?.subscription_plan_id) && Number(subscription?.subscription_plan_id) !== newPlanId;

    const trialForm = useForm({ plan_id: newPlanId ?? '' });
    const subscribeForm = useForm({ plan_id: newPlanId ?? '', term_months: newMonths });
    const settleForm = useForm({ method: 'cash', reference: '' });

    /*
     * .transform() rather than setData-then-post: setData schedules a React
     * state update, so a post() called right after in the same tick would
     * still read the value from before the click. transform() reads newPlanId
     * and newMonths from this render directly, which is what is actually
     * current when the button was pressed.
     */
    const startTrial = () => {
        trialForm.transform(() => ({ plan_id: newPlanId }));
        trialForm.post(`/tenant-subscriptions/${organization.id}/trial`, { preserveScroll: true });
    };

    const subscribeTenant = () => {
        subscribeForm.transform(() => ({ plan_id: newPlanId, term_months: newMonths }));
        subscribeForm.post(`/tenant-subscriptions/${organization.id}/subscribe`, { preserveScroll: true });
    };

    const outstanding = (subscription?.invoices ?? []).find((invoice: any) => ['issued', 'overdue', 'partial'].includes(invoice.status));

    const settleOutstanding = (event: FormEvent) => {
        event.preventDefault();
        if (!outstanding) return;

        settleForm.post(`/tenant-subscriptions/${organization.id}/invoices/${outstanding.id}/settle`, {
            preserveScroll: true,
            onSuccess: () => settleForm.reset('reference'),
        });
    };

    const form = useForm({
        subscription_plan_id: subscription?.subscription_plan_id ?? plans[0]?.id ?? '',
        status: subscription?.status ?? organization.status ?? 'trial',
        billing_cycle: subscription?.billing_cycle ?? 'monthly',
        trial_ends_at: subscription?.trial_ends_at ? subscription.trial_ends_at.slice(0, 10) : '',
        current_period_ends_at: subscription?.current_period_ends_at ? subscription.current_period_ends_at.slice(0, 10) : '',
    });
    const invoiceForm = useForm({
        period_starts_on: subscription?.current_period_starts_at ? subscription.current_period_starts_at.slice(0, 10) : '',
        period_ends_on: subscription?.current_period_ends_at ? subscription.current_period_ends_at.slice(0, 10) : '',
        issued_on: new Date().toISOString().slice(0, 10),
        due_on: '',
        subtotal: '',
        tax_amount: 0,
        discount_amount: 0,
        notes: '',
    });
    const paymentForm = useForm({
        subscription_invoice_id: subscription?.invoices?.[0]?.id ?? '',
        amount: subscription?.invoices?.[0] ? Number(subscription.invoices[0].total_amount) - Number(subscription.invoices[0].amount_paid) : 0,
        method: 'manual',
        external_reference: '',
        paid_at: new Date().toISOString().slice(0, 16),
        notes: '',
    });

    const selectedPlan = plans.find((plan) => Number(plan.id) === Number(form.data.subscription_plan_id));
    const invoices = subscription?.invoices ?? [];
    const payments = subscription?.payments ?? [];
    const events = subscription?.events ?? [];

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            subscription_plan_id: Number(data.subscription_plan_id),
            trial_ends_at: data.trial_ends_at || null,
            current_period_ends_at: data.current_period_ends_at || null,
        }));
        form.post(`/tenant-subscriptions/${organization.id}`, { preserveScroll: true });
    };

    const issueInvoice = (event: FormEvent) => {
        event.preventDefault();
        invoiceForm.transform((data) => ({
            ...data,
            period_starts_on: data.period_starts_on || null,
            period_ends_on: data.period_ends_on || null,
            due_on: data.due_on || null,
            subtotal: data.subtotal === '' ? null : Number(data.subtotal),
            tax_amount: Number(data.tax_amount),
            discount_amount: Number(data.discount_amount),
        }));
        invoiceForm.post(`/tenant-subscriptions/${organization.id}/invoices`, { preserveScroll: true, onSuccess: () => invoiceForm.reset('notes') });
    };

    const recordPayment = (event: FormEvent) => {
        event.preventDefault();
        paymentForm.transform((data) => ({
            ...data,
            subscription_invoice_id: data.subscription_invoice_id ? Number(data.subscription_invoice_id) : null,
            amount: Number(data.amount),
            paid_at: data.paid_at || null,
        }));
        paymentForm.post(`/tenant-subscriptions/${organization.id}/payments`, {
            preserveScroll: true,
            onSuccess: () => paymentForm.reset('external_reference', 'notes'),
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex flex-wrap items-start justify-between gap-3 text-base">
                    <div className="flex items-start gap-3">
                        <Building2 className="mt-1 size-5 text-pink-600" />
                        <div>
                            <p>{organization.name}</p>
                            <p className="text-muted-foreground mt-1 text-sm font-normal">
                                {organization.owner_name ?? organization.email ?? 'No owner contact'}
                            </p>
                        </div>
                    </div>
                    <StatusBadge status={organization.status} />
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-5">
                    <Info label="Current Plan" value={subscription?.plan?.name ?? 'Unassigned'} />
                    <Info label="Branches" value={organization.branches_count} />
                    <Info label="Courts" value={organization.courts_count} />
                    <Info label="Users" value={organization.users_count} />
                    <Info label="Monthly" value={selectedPlan ? currency(selectedPlan.monthly_price) : '-'} />
                </div>

                {/* ---- Start a trial or subscribe: the path that keeps
                    term_months, grace_days and QRPh in sync -------------- */}
                <div className="bg-primary-soft/30 border-primary/20 space-y-4 rounded-lg border p-4">
                    <div>
                        <p className="text-sm font-semibold">Start or change subscription</p>
                        <p className="text-muted-foreground text-xs">
                            The trial is {trialDays} days, free. Subscribing raises an invoice the club pays by QRPh from its own billing page.
                        </p>
                    </div>

                    {/* Step 1. The whole plan, not just its name: choosing
                        between three names told you nothing about what the club
                        is being moved onto or what it costs them. */}
                    <div>
                        <p className="text-muted-foreground mb-1.5 text-[0.6875rem] font-semibold tracking-wide uppercase">1 · Plan</p>
                        <div className="grid gap-2 sm:grid-cols-3">
                            {plans.map((plan) => {
                                const active = Number(plan.id) === newPlanId;
                                const current = Number(plan.id) === Number(subscription?.subscription_plan_id);

                                return (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        aria-pressed={active}
                                        onClick={() => setNewPlanId(Number(plan.id))}
                                        className={cn(
                                            'rounded-lg border px-3 py-2.5 text-left transition-colors',
                                            active ? 'border-primary bg-primary-soft' : 'border-border bg-surface hover:border-border-strong',
                                        )}
                                    >
                                        <span className="flex items-baseline justify-between gap-2">
                                            <span className="text-label text-foreground font-semibold">{plan.name}</span>
                                            {current && <span className="text-meta text-primary font-semibold">current</span>}
                                        </span>
                                        <span data-numeric className="text-foreground mt-0.5 block text-sm font-semibold">
                                            {currency(plan.monthly_price)}
                                            <span className="text-muted font-normal">/mo</span>
                                        </span>
                                        {/* What they are actually buying. */}
                                        <span className="text-meta text-muted mt-1 block">
                                            <span data-numeric>{plan.branch_limit ?? '∞'}</span> branches ·{' '}
                                            <span data-numeric>{plan.court_limit ?? '∞'}</span> courts ·{' '}
                                            <span data-numeric>{plan.staff_limit ?? '∞'}</span> staff
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 2. Committing longer is the club's discount, so the
                        saving is on the control that decides it. */}
                    {newPlan?.terms && (
                        <div>
                            <p className="text-muted-foreground mb-1.5 text-[0.6875rem] font-semibold tracking-wide uppercase">2 · Term</p>
                            <div className="grid gap-2 sm:grid-cols-3">
                                {newPlan.terms.map((term: any) => {
                                    const active = term.months === newMonths;

                                    return (
                                        <button
                                            key={term.months}
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() => setNewMonths(term.months)}
                                            className={cn(
                                                'rounded-lg border px-3 py-2.5 text-left transition-colors',
                                                active ? 'border-primary bg-primary-soft' : 'border-border bg-surface hover:border-border-strong',
                                            )}
                                        >
                                            <span className="flex items-baseline justify-between gap-2">
                                                <span className="text-label text-foreground font-semibold">{term.label}</span>
                                                {term.saving_percent > 0 && (
                                                    <span className="text-meta text-success font-semibold">save {term.saving_percent}%</span>
                                                )}
                                            </span>
                                            <span data-numeric className="text-foreground mt-0.5 block text-sm font-semibold">
                                                {currency(term.per_month)}
                                                <span className="text-muted font-normal">/mo</span>
                                            </span>
                                            <span data-numeric className="text-meta text-muted mt-1 block">
                                                {currency(term.total)} billed now
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 3. What is about to happen, in one line, before it
                        happens — this raises a real bill against a real club. */}
                    <div className="border-primary/20 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                        <div className="min-w-0">
                            <p className="text-label text-foreground font-semibold">
                                {newPlan?.name ?? 'No plan'}
                                {newTerm ? ` · ${newTerm.label}` : ''}
                            </p>
                            <p className="text-meta text-muted">
                                {changingPlan && subscription?.plan?.name ? `Moving from ${subscription.plan.name}. ` : ''}
                                {newTerm ? (
                                    <>
                                        Invoice for <span data-numeric>{currency(newTerm.total)}</span> raised now, covering{' '}
                                        <span data-numeric>{newTerm.months}</span> {newTerm.months === 1 ? 'month' : 'months'}.
                                    </>
                                ) : (
                                    'Pick a plan and a term.'
                                )}
                            </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={trialForm.processing || !newPlanId || Boolean(subscription?.trial_ends_at)}
                                title={subscription?.trial_ends_at ? 'This club has already had its trial' : undefined}
                                onClick={startTrial}
                            >
                                <Sparkles className="mr-1.5 size-4" />
                                {subscription?.trial_ends_at ? 'Trial already used' : `Start ${trialDays}-day trial`}
                            </Button>

                            {/* Asked first: this bills a club, and the button
                                used to do it on one click from a card that
                                looks like every other card on the page. */}
                            <ConfirmDialog
                                trigger={
                                    <Button type="button" size="sm" disabled={subscribeForm.processing || !newPlanId || !newTerm}>
                                        <CreditCard className="mr-1.5 size-4" />
                                        Subscribe{newTerm ? ` · ${currency(newTerm.total)}` : ''}
                                    </Button>
                                }
                                title={`Put ${organization.name} on ${newPlan?.name ?? 'this plan'}?`}
                                description={
                                    newTerm
                                        ? `This raises an invoice for ${currency(newTerm.total)} covering ${newTerm.months} ${
                                              newTerm.months === 1 ? 'month' : 'months'
                                          }. The club pays it by QRPh from its own billing page.`
                                        : 'Pick a term first.'
                                }
                                confirmLabel="Subscribe"
                                onConfirm={subscribeTenant}
                            />
                        </div>
                    </div>

                    {(trialForm.errors as any).plan_id && (
                        <p role="alert" className="text-meta text-danger">
                            {(trialForm.errors as any).plan_id}
                        </p>
                    )}

                    {outstanding && (
                        <form onSubmit={settleOutstanding} className="border-primary/20 border-t pt-3">
                            <p className="text-label text-foreground font-semibold">
                                Outstanding: {outstanding.invoice_number} · <span data-numeric>{currency(outstanding.total_amount)}</span>
                            </p>
                            <p className="text-meta text-muted mt-0.5">Only for money taken outside QRPh — cash at the desk, or a bank transfer.</p>
                            <div className="mt-2 flex flex-wrap items-end gap-2">
                                <Select
                                    label="Paid by"
                                    value={settleForm.data.method}
                                    options={['cash', 'bank_transfer', 'other']}
                                    onChange={(value) => settleForm.setData('method', value)}
                                />
                                <Field
                                    label="Reference"
                                    value={settleForm.data.reference}
                                    onChange={(value) => settleForm.setData('reference', value)}
                                    error={(settleForm.errors as any).method}
                                />
                                <Button size="sm" disabled={settleForm.processing}>
                                    <Check className="mr-1.5 size-4" />
                                    Mark this invoice paid
                                </Button>
                            </div>
                            {!canTakePayment && (
                                <p className="text-meta text-muted mt-1">
                                    QRPh is not connected, so the club cannot pay this online yet; this records an offline payment instead.
                                </p>
                            )}
                        </form>
                    )}
                </div>

                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Manual override</p>

                <form onSubmit={submit} className="grid gap-3 rounded-lg border p-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr_auto] lg:items-end">
                    <div className="space-y-2">
                        <Label>Plan</Label>
                        <select
                            className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                            value={form.data.subscription_plan_id}
                            onChange={(event) => form.setData('subscription_plan_id', Number(event.target.value))}
                        >
                            {plans.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.name} - {currency(plan.monthly_price)}
                                </option>
                            ))}
                        </select>
                        {form.errors.subscription_plan_id && <p className="text-xs text-red-600">{form.errors.subscription_plan_id}</p>}
                    </div>
                    <Select
                        label="Status"
                        value={form.data.status}
                        options={['trial', 'active', 'grace_period', 'expired', 'suspended', 'cancelled']}
                        onChange={(value) => form.setData('status', value)}
                    />
                    <Select
                        label="Cycle"
                        value={form.data.billing_cycle}
                        options={['monthly', 'quarterly', 'annual', 'manual']}
                        onChange={(value) => form.setData('billing_cycle', value)}
                    />
                    <Field
                        label="Trial Ends"
                        type="date"
                        value={form.data.trial_ends_at}
                        onChange={(value) => form.setData('trial_ends_at', value)}
                        error={form.errors.trial_ends_at}
                    />
                    <Field
                        label="Period Ends"
                        type="date"
                        value={form.data.current_period_ends_at}
                        onChange={(value) => form.setData('current_period_ends_at', value)}
                        error={form.errors.current_period_ends_at}
                    />
                    <Button disabled={form.processing || plans.length === 0}>
                        <CreditCard className="mr-2 size-4" />
                        Save
                    </Button>
                </form>

                {subscription && (
                    <div className="grid gap-4 xl:grid-cols-2">
                        <form onSubmit={issueInvoice} className="space-y-3 rounded-lg border p-3">
                            <p className="text-sm font-semibold">Issue Platform Invoice</p>
                            <div className="grid gap-3 md:grid-cols-2">
                                <Field
                                    label="Period Starts"
                                    type="date"
                                    value={invoiceForm.data.period_starts_on}
                                    onChange={(value) => invoiceForm.setData('period_starts_on', value)}
                                    error={invoiceForm.errors.period_starts_on}
                                />
                                <Field
                                    label="Period Ends"
                                    type="date"
                                    value={invoiceForm.data.period_ends_on}
                                    onChange={(value) => invoiceForm.setData('period_ends_on', value)}
                                    error={invoiceForm.errors.period_ends_on}
                                />
                                <Field
                                    label="Issued"
                                    type="date"
                                    value={invoiceForm.data.issued_on}
                                    onChange={(value) => invoiceForm.setData('issued_on', value)}
                                    error={invoiceForm.errors.issued_on}
                                />
                                <Field
                                    label="Due"
                                    type="date"
                                    value={invoiceForm.data.due_on}
                                    onChange={(value) => invoiceForm.setData('due_on', value)}
                                    error={invoiceForm.errors.due_on}
                                />
                                <Field
                                    label="Subtotal Override"
                                    type="number"
                                    value={invoiceForm.data.subtotal}
                                    onChange={(value) => invoiceForm.setData('subtotal', value)}
                                    error={invoiceForm.errors.subtotal}
                                />
                                <Field
                                    label="Tax"
                                    type="number"
                                    value={invoiceForm.data.tax_amount}
                                    onChange={(value) => invoiceForm.setData('tax_amount', Number(value))}
                                    error={invoiceForm.errors.tax_amount}
                                />
                                <Field
                                    label="Discount"
                                    type="number"
                                    value={invoiceForm.data.discount_amount}
                                    onChange={(value) => invoiceForm.setData('discount_amount', Number(value))}
                                    error={invoiceForm.errors.discount_amount}
                                />
                            </div>
                            <Field
                                label="Notes"
                                value={invoiceForm.data.notes}
                                onChange={(value) => invoiceForm.setData('notes', value)}
                                error={invoiceForm.errors.notes}
                            />
                            <Button disabled={invoiceForm.processing}>Issue Invoice</Button>
                        </form>

                        <form onSubmit={recordPayment} className="space-y-3 rounded-lg border p-3">
                            <p className="text-sm font-semibold">Record Platform Payment</p>
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Invoice</Label>
                                    <select
                                        className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                                        value={paymentForm.data.subscription_invoice_id}
                                        onChange={(event) =>
                                            paymentForm.setData('subscription_invoice_id', event.target.value ? Number(event.target.value) : '')
                                        }
                                    >
                                        <option value="">Unapplied payment</option>
                                        {invoices.map((invoice: any) => (
                                            <option key={invoice.id} value={invoice.id}>
                                                {invoice.invoice_number} - {currency(Number(invoice.total_amount) - Number(invoice.amount_paid))}
                                            </option>
                                        ))}
                                    </select>
                                    {paymentForm.errors.subscription_invoice_id && (
                                        <p className="text-xs text-red-600">{paymentForm.errors.subscription_invoice_id}</p>
                                    )}
                                </div>
                                <Field
                                    label="Amount"
                                    type="number"
                                    value={paymentForm.data.amount}
                                    onChange={(value) => paymentForm.setData('amount', Number(value))}
                                    error={paymentForm.errors.amount}
                                />
                                <Select
                                    label="Method"
                                    value={paymentForm.data.method}
                                    options={['manual', 'cash', 'bank_transfer', 'gcash', 'maya', 'card', 'check', 'other']}
                                    onChange={(value) => paymentForm.setData('method', value)}
                                />
                                <Field
                                    label="Paid At"
                                    type="datetime-local"
                                    value={paymentForm.data.paid_at}
                                    onChange={(value) => paymentForm.setData('paid_at', value)}
                                    error={paymentForm.errors.paid_at}
                                />
                                <Field
                                    label="External Ref"
                                    value={paymentForm.data.external_reference}
                                    onChange={(value) => paymentForm.setData('external_reference', value)}
                                    error={paymentForm.errors.external_reference}
                                />
                            </div>
                            <Field
                                label="Notes"
                                value={paymentForm.data.notes}
                                onChange={(value) => paymentForm.setData('notes', value)}
                                error={paymentForm.errors.notes}
                            />
                            <Button disabled={paymentForm.processing}>Record Payment</Button>
                        </form>
                    </div>
                )}

                <div className="grid gap-4 xl:grid-cols-3">
                    <Ledger title="Invoices" rows={invoices} empty="No platform invoices yet." />
                    <Ledger title="Payments" rows={payments} empty="No subscription payments yet." />
                    <Ledger title="Events" rows={events} empty="No subscription events yet." />
                </div>
            </CardContent>
        </Card>
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
            <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <select
                className="bg-background h-10 w-full rounded-md border px-3 text-sm capitalize"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option.replaceAll('_', ' ')}
                    </option>
                ))}
            </select>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
        </div>
    );
}

function Ledger({ title, rows, empty }: { title: string; rows: any[]; empty: string }) {
    return (
        <div className="space-y-2 rounded-lg border p-3">
            <p className="text-sm font-semibold">{title}</p>
            {rows.map((row) => (
                <div key={`${title}-${row.id}`} className="bg-surface-muted/40 rounded-md p-3 text-sm">
                    {'invoice_number' in row && (
                        <>
                            <div className="flex items-center justify-between gap-3">
                                <p className="font-medium">{row.invoice_number}</p>
                                <StatusBadge status={row.status} />
                            </div>
                            <p className="text-muted-foreground mt-1">
                                {currency(row.amount_paid)} / {currency(row.total_amount)}
                            </p>
                        </>
                    )}
                    {'reference' in row && (
                        <>
                            <div className="flex items-center justify-between gap-3">
                                <p className="font-medium">{row.reference}</p>
                                <StatusBadge status={row.status} />
                            </div>
                            <p className="text-muted-foreground mt-1">
                                {currency(row.amount)} - {row.method}
                            </p>
                        </>
                    )}
                    {'event_type' in row && (
                        <>
                            <p className="font-medium">{row.event_type}</p>
                            <p className="text-muted-foreground mt-1">
                                {row.actor_name ?? 'CourtPrime'} - {row.occurred_at}
                            </p>
                        </>
                    )}
                </div>
            ))}
            {rows.length === 0 && <p className="bg-surface-muted/40 text-muted-foreground rounded-md p-3 text-sm">{empty}</p>}
        </div>
    );
}
