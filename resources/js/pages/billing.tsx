import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { currency, friendlyDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertTriangle, Check, Clock, QrCode, Sparkles } from 'lucide-react';
import { useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payload from BillingController. */

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Billing', href: '/billing' }];

type Term = { months: number; label: string; total: number; per_month: number; saving: number; saving_percent: number };
type Plan = { id: number; code: string; name: string; description?: string | null; terms: Term[] };

type Props = {
    subscription: any | null;
    outstanding: any | null;
    plans: Plan[];
    invoices: any[];
    trialDays: number;
    defaultTermMonths: number;
    canTakePayment: boolean;
};

/**
 * A club's own billing.
 *
 * Answers the four questions a club actually has: what am I on, when is it due,
 * what happens if I am late, and how do I pay. The terms sit next to each other
 * with what each saves, because the discount for committing is the reason to
 * read this page at all.
 */
export default function Billing({ subscription, outstanding, plans, invoices, trialDays, defaultTermMonths, canTakePayment }: Props) {
    const { flash, errors } = usePage().props as any;
    const [planId, setPlanId] = useState<number | null>(plans[0]?.id ?? null);
    const [months, setMonths] = useState<number>(subscription?.term_months ?? defaultTermMonths);

    const plan = plans.find((entry) => entry.id === planId) ?? plans[0] ?? null;
    const term = plan?.terms.find((entry) => entry.months === months) ?? plan?.terms[0] ?? null;

    const trialing = subscription?.status === 'trialing';
    const pastDue = subscription?.status === 'past_due';
    const lapsed = subscription?.status === 'lapsed';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Billing" />

            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="min-w-0 space-y-6">
                    {/* ---- Where the club stands ------------------------------ */}
                    <section
                        className={cn(
                            'rounded-2xl px-5 py-5 sm:px-6',
                            lapsed ? 'bg-danger-soft border-danger/30 border' : 'bg-surface-deep text-surface-deep-foreground',
                        )}
                    >
                        {subscription ? (
                            <>
                                <p className={cn('text-eyebrow uppercase', lapsed ? 'text-danger' : 'text-primary')}>
                                    {trialing ? 'Free trial' : lapsed ? 'Subscription lapsed' : pastDue ? 'Payment due' : 'Subscription active'}
                                </p>
                                <h1
                                    className={cn(
                                        'mt-1 text-[1.75rem] leading-tight font-semibold tracking-tight',
                                        lapsed ? 'text-foreground' : 'text-white',
                                    )}
                                >
                                    {subscription.plan ?? 'No plan'}
                                </h1>

                                <p className={cn('text-meta mt-2', lapsed ? 'text-secondary' : 'text-white/60')}>
                                    {trialing && subscription.trial_ends_at && (
                                        <>Everything is unlocked until {friendlyDate(subscription.trial_ends_at)}.</>
                                    )}
                                    {!trialing && subscription.period_ends_at && (
                                        <>
                                            {pastDue ? 'This period ran to ' : 'Paid up to '}
                                            <span data-numeric>{friendlyDate(subscription.period_ends_at)}</span>
                                            {subscription.term_months > 1 && <> · {subscription.term_months} month term</>}
                                        </>
                                    )}
                                </p>

                                {pastDue && subscription.grace_ends_on && (
                                    <p className="text-label mt-3 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white">
                                        <Clock className="size-4 shrink-0" aria-hidden />
                                        Courts keep running until <span data-numeric>{friendlyDate(subscription.grace_ends_on)}</span>
                                    </p>
                                )}

                                {lapsed && (
                                    <p className="text-label text-danger mt-3 flex items-center gap-2">
                                        <AlertTriangle className="size-4 shrink-0" aria-hidden />
                                        Pay the outstanding invoice to switch the club back on. Nothing has been deleted.
                                    </p>
                                )}
                            </>
                        ) : (
                            <>
                                <p className="text-eyebrow text-primary uppercase">Not subscribed</p>
                                <h1 className="mt-1 text-[1.75rem] leading-tight font-semibold tracking-tight text-white">
                                    Start with {trialDays} days free
                                </h1>
                                <p className="text-meta mt-2 text-white/60">
                                    Every feature, no card, nothing to pay. Partner clubs come on this way.
                                </p>
                                <Button
                                    className="mt-4"
                                    onClick={() => router.post('/billing/trial', { plan_id: plan?.id }, { preserveScroll: true })}
                                    disabled={!plan}
                                >
                                    <Sparkles className="size-4" />
                                    Start the free trial
                                </Button>
                            </>
                        )}
                    </section>

                    {/* ---- Choose a plan and a term --------------------------- */}
                    <section>
                        <h2 className="text-h2 text-foreground mb-1">{subscription ? 'Change plan or term' : 'Pick a plan'}</h2>
                        <p className="text-meta text-muted mb-4">Longer terms cost less per month. The saving is the club's own annual rate.</p>

                        <div className="grid gap-3 sm:grid-cols-3">
                            {plans.map((entry) => (
                                <button
                                    key={entry.id}
                                    type="button"
                                    aria-pressed={entry.id === planId}
                                    onClick={() => setPlanId(entry.id)}
                                    className={cn(
                                        'rounded-xl border p-4 text-left transition-colors',
                                        entry.id === planId
                                            ? 'border-primary bg-primary-soft'
                                            : 'border-border bg-surface hover:border-border-strong',
                                    )}
                                >
                                    <p className="text-label text-foreground font-semibold">{entry.name}</p>
                                    <p data-numeric className="text-meta text-muted mt-0.5">
                                        from {currency(entry.terms[0]?.per_month ?? 0)}/mo
                                    </p>
                                </button>
                            ))}
                        </div>

                        {plan && (
                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                {plan.terms.map((option) => (
                                    <button
                                        key={option.months}
                                        type="button"
                                        aria-pressed={option.months === months}
                                        onClick={() => setMonths(option.months)}
                                        className={cn(
                                            'relative rounded-xl border p-4 text-left transition-colors',
                                            option.months === months
                                                ? 'border-primary bg-primary-soft'
                                                : 'border-border bg-surface hover:border-border-strong',
                                        )}
                                    >
                                        {option.saving_percent > 0 && (
                                            <span className="bg-success absolute -top-2 right-3 rounded-full px-2 py-0.5 text-[0.625rem] font-semibold text-white uppercase">
                                                save {option.saving_percent}%
                                            </span>
                                        )}
                                        <p className="text-label text-foreground font-semibold">{option.label}</p>
                                        <p data-numeric className="text-h3 text-foreground mt-1">
                                            {currency(option.per_month)}
                                            <span className="text-meta text-muted font-normal"> /mo</span>
                                        </p>
                                        <p data-numeric className="text-meta text-muted mt-0.5">
                                            {currency(option.total)} billed {option.months === 1 ? 'monthly' : `every ${option.months} months`}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}

                        <Button
                            size="touch"
                            className="mt-4 w-full sm:w-auto"
                            disabled={!plan || !term}
                            onClick={() => router.post('/billing/subscribe', { plan_id: plan?.id, term_months: months }, { preserveScroll: true })}
                        >
                            {subscription && !trialing ? 'Change to this' : 'Start this subscription'}
                            {term && <span data-numeric> · {currency(term.total)}</span>}
                        </Button>
                    </section>

                    {invoices.length > 0 && (
                        <section>
                            <h2 className="text-h2 text-foreground mb-3">Invoices</h2>
                            <ul className="divide-border border-border divide-y overflow-hidden rounded-xl border">
                                {invoices.map((invoice) => (
                                    <li key={invoice.number} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                                        <span data-numeric className="text-label text-foreground font-medium">
                                            {invoice.number}
                                        </span>
                                        <span className="text-meta text-muted min-w-0 flex-1 truncate">{invoice.period}</span>
                                        <span data-numeric className="text-label text-foreground font-semibold">
                                            {currency(invoice.total)}
                                        </span>
                                        <span className={cn('text-meta font-medium', invoice.status === 'paid' ? 'text-success' : 'text-warning')}>
                                            {invoice.status}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>

                {/* ---- What is owed right now ----------------------------- */}
                <aside className="min-w-0">
                    <div className="border-border bg-surface rounded-xl border p-4 sm:p-5">
                        <h2 className="text-h3 text-foreground">Amount due</h2>

                        {outstanding ? (
                            <>
                                <p data-numeric className="text-foreground mt-2 text-[2rem] leading-none font-semibold">
                                    {currency(outstanding.total)}
                                </p>
                                <p className="text-meta text-muted mt-1.5">
                                    {outstanding.number} · due <span data-numeric>{friendlyDate(outstanding.due_on)}</span>
                                </p>
                                {outstanding.grace_ends_on && (
                                    <p className="text-meta text-warning mt-1">
                                        Pay by <span data-numeric>{friendlyDate(outstanding.grace_ends_on)}</span> to stay open
                                    </p>
                                )}

                                <Button
                                    size="touch"
                                    className="mt-4 w-full"
                                    disabled={!canTakePayment}
                                    onClick={() => router.post(`/billing/invoices/${outstanding.id}/pay`, {}, { preserveScroll: true })}
                                >
                                    <QrCode className="size-4" />
                                    Pay with QRPh
                                </Button>

                                {!canTakePayment && (
                                    <p className="text-meta text-muted mt-2">
                                        QRPh is not connected yet. Add the PayMongo keys to take payments here.
                                    </p>
                                )}

                                {flash?.qr && (
                                    <a
                                        href={flash.qr}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary text-meta mt-3 block font-medium hover:underline"
                                    >
                                        Open the QR to scan
                                    </a>
                                )}

                                {errors?.payment && (
                                    <p role="alert" className="text-meta text-danger mt-2">
                                        {errors.payment}
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="text-meta text-muted mt-2 flex items-center gap-1.5">
                                <Check className="text-success size-4 shrink-0" aria-hidden />
                                Nothing outstanding.
                            </p>
                        )}
                    </div>
                </aside>
            </div>
        </AppLayout>
    );
}
