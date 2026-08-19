import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { LifeBuoy, MessageSquarePlus } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Support Tickets', href: '/support-tickets' }];

export default function SupportTickets({
    tickets,
    metrics,
    canUseInternalNotes,
}: {
    tickets: any;
    metrics: Record<string, number>;
    canUseInternalNotes: boolean;
}) {
    const form = useForm({
        subject: '',
        category: 'general',
        priority: 'normal',
        body: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/support-tickets', { preserveScroll: true, onSuccess: () => form.reset('subject', 'body') });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Support Tickets" />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[0.85fr_1.6fr]">
                <div className="space-y-4">
                    <Card>
                        <CardContent className="grid grid-cols-3 gap-3 p-4">
                            <Metric label="Open" value={metrics.open} />
                            <Metric label="Urgent" value={metrics.urgent} />
                            <Metric label="Resolved" value={metrics.resolved} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <LifeBuoy className="size-4 text-pink-600" />
                                New Ticket
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <Field
                                    label="Subject"
                                    value={form.data.subject}
                                    onChange={(value) => form.setData('subject', value)}
                                    error={form.errors.subject}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <Select
                                        label="Category"
                                        value={form.data.category}
                                        options={['general', 'billing', 'technical', 'feature_request', 'account', 'incident']}
                                        onChange={(value) => form.setData('category', value)}
                                    />
                                    <Select
                                        label="Priority"
                                        value={form.data.priority}
                                        options={['low', 'normal', 'high', 'urgent']}
                                        onChange={(value) => form.setData('priority', value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Message</Label>
                                    <textarea
                                        className="bg-background min-h-28 w-full rounded-md border px-3 py-2 text-sm"
                                        value={form.data.body}
                                        onChange={(event) => form.setData('body', event.target.value)}
                                    />
                                    {form.errors.body && <p className="text-xs text-red-600">{form.errors.body}</p>}
                                </div>
                                <Button disabled={form.processing} className="w-full">
                                    Create Ticket
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Support Queue</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {tickets.data.map((ticket: any) => (
                            <TicketRow key={ticket.id} ticket={ticket} canUseInternalNotes={canUseInternalNotes} />
                        ))}
                        {tickets.data.length === 0 && <p className="text-muted-foreground text-sm">No support tickets yet.</p>}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function TicketRow({ ticket, canUseInternalNotes }: { ticket: any; canUseInternalNotes: boolean }) {
    const replyForm = useForm({
        body: '',
        internal: false as boolean,
        status: ticket.status,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        replyForm.post(`/support-tickets/${ticket.id}/messages`, { preserveScroll: true, onSuccess: () => replyForm.reset('body') });
    };

    return (
        <div className="rounded-lg border p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{ticket.subject}</p>
                        <StatusBadge status={ticket.status} />
                        <StatusBadge status={ticket.priority} />
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {ticket.ticket_number} - {ticket.organization?.name ?? 'Platform'} - {ticket.creator?.name ?? 'CourtPrime user'}
                    </p>
                </div>
                <StatusBadge status={ticket.category} />
            </div>
            <div className="mt-4 space-y-2">
                {(ticket.messages ?? []).map((message: any) => (
                    <div key={message.id} className="dark:bg-surface-muted rounded-md bg-slate-50 p-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">{message.author_name}</p>
                            {message.internal && <StatusBadge status="internal" />}
                        </div>
                        <p className="text-muted-foreground mt-2">{message.body}</p>
                    </div>
                ))}
            </div>
            <form onSubmit={submit} className="mt-4 space-y-3">
                <textarea
                    className="bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                    value={replyForm.data.body}
                    onChange={(event) => replyForm.setData('body', event.target.value)}
                />
                <div className="flex flex-wrap items-center gap-3">
                    <Select
                        label="Status"
                        value={replyForm.data.status}
                        options={['open', 'pending', 'waiting_on_customer', 'resolved', 'closed']}
                        onChange={(value) => replyForm.setData('status', value)}
                    />
                    {canUseInternalNotes && (
                        <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
                            <input
                                type="checkbox"
                                checked={replyForm.data.internal}
                                onChange={(event) => replyForm.setData('internal', event.target.checked)}
                            />
                            Internal note
                        </label>
                    )}
                    <Button disabled={replyForm.processing}>
                        <MessageSquarePlus className="size-4" />
                        Reply
                    </Button>
                </div>
            </form>
        </div>
    );
}

function Field({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Input value={value} onChange={(event) => onChange(event.target.value)} />
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <select
                className="bg-background h-10 rounded-md border px-3 text-sm capitalize"
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

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
        </div>
    );
}
