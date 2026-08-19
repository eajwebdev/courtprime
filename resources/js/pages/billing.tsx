import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { currency, friendlyDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertTriangle, Check, Clock, Mail, QrCode } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payload from BillingController. */

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Billing', href: '/billing' }];

type Props = {
    subscription: any | null;
    outstanding: any | null;
    invoices: any[];
    canTakePayment: boolean;
};

/**
 * A club's own billing.
 *
 * View and pay, nothing else. Choosing a plan, a term, or starting a trial is
 * EAJ's call from /tenant-subscriptions, the same as deciding who is on the
 * network at all. This page answers what the club owes and lets it clear that
 * by QRPh; it does not offer a way to grant itself a trial or change its own
 * plan.
 */
export default function Billing({ subscription, outstanding, invoices, canTakePayment }: Props) {
    const { flash, errors } = usePage().props as any;

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
                                <p className="text-eyebrow text-primary uppercase">Not subscribed yet</p>
                                <h1 className="mt-1 text-[1.75rem] leading-tight font-semibold tracking-tight text-white">
                                    Your CourtPrime team sets this up
                                </h1>
                                <p className="text-meta mt-2 max-w-md text-white/60">
                                    Trials, plans and billing terms are arranged with EAJ CourtPrime directly. Once your subscription is started,
                                    this page is where you see what is owed and pay it.
                                </p>
                                <Button asChild variant="onDeep" className="mt-4">
                                    <a href="mailto:hello@courtprime.app">
                                        <Mail className="size-4" />
                                        Contact CourtPrime
                                    </a>
                                </Button>
                            </>
                        )}
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
