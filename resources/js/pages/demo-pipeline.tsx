import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { BriefcaseBusiness, Building2 } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Demo Pipeline', href: '/demo-pipeline' }];

export default function DemoPipeline({
    requests,
    assignees,
    plans,
    metrics,
}: {
    requests: any;
    assignees: any[];
    plans: any[];
    metrics: Record<string, number>;
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Demo Pipeline" />
            <div className="space-y-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold">EAJ Demo Pipeline</h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Manage CourtPrime demo requests, sales qualification, follow-ups, and conversion status.
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                    <Metric label="New" value={metrics.new} />
                    <Metric label="Scheduled" value={metrics.scheduled} />
                    <Metric label="Proposal" value={metrics.proposal} />
                    <Metric label="Converted" value={metrics.converted} />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <BriefcaseBusiness className="size-4 text-pink-600" />
                            Requests
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {requests.data.map((request: any) => (
                            <PipelineRow key={request.id} request={request} assignees={assignees} plans={plans} />
                        ))}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function PipelineRow({ request, assignees, plans }: { request: any; assignees: any[]; plans: any[] }) {
    const form = useForm({
        status: request.status,
        assigned_to: request.assigned_to ?? '',
        follow_up_at: request.follow_up_at ? request.follow_up_at.slice(0, 16) : '',
        notes: request.notes ?? '',
    });
    const convertForm = useForm({
        subscription_plan_id: plans[0]?.id ?? '',
        billing_cycle: 'monthly',
        trial_ends_at: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(`/demo-pipeline/${request.id}`, { preserveScroll: true });
    };

    const convert = (event: FormEvent) => {
        event.preventDefault();
        convertForm.transform((data) => ({
            ...data,
            subscription_plan_id: Number(data.subscription_plan_id),
            trial_ends_at: data.trial_ends_at || null,
        }));
        convertForm.post(`/demo-pipeline/${request.id}/convert`, { preserveScroll: true });
    };

    return (
        <div className="rounded-lg border p-4">
            <div className="grid gap-3 xl:grid-cols-[1fr_1.1fr]">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{request.business_name}</p>
                        <StatusBadge status={request.status} />
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {request.reference} - {request.contact_person} - {request.email}
                    </p>
                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                        <Info label="Branches" value={request.branches_count} />
                        <Info label="Courts" value={request.courts_count} />
                        <Info label="Preference" value={request.demo_preference} />
                        <Info label="Assigned" value={request.assignee?.name ?? 'Unassigned'} />
                    </div>
                    {request.features_needed?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {request.features_needed.map((feature: string) => (
                                <span
                                    key={feature}
                                    className="dark:bg-surface-muted dark:text-muted-foreground rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                                >
                                    {feature}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <form onSubmit={submit} className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-3">
                        <Select
                            label="Status"
                            value={form.data.status}
                            options={['new', 'qualified', 'scheduled', 'proposal', 'converted', 'lost']}
                            onChange={(value) => form.setData('status', value)}
                        />
                        <Select
                            label="Assignee"
                            value={String(form.data.assigned_to)}
                            options={['', ...assignees.map((assignee) => String(assignee.id))]}
                            labels={{ '': 'Unassigned', ...Object.fromEntries(assignees.map((assignee) => [String(assignee.id), assignee.name])) }}
                            onChange={(value) => form.setData('assigned_to', value ? Number(value) : '')}
                        />
                        <Field
                            label="Follow Up"
                            type="datetime-local"
                            value={form.data.follow_up_at}
                            onChange={(value) => form.setData('follow_up_at', value)}
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
                    <Button disabled={form.processing}>Update Pipeline</Button>
                </form>
            </div>
            <div className="mt-4 rounded-lg border p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                        <Building2 className="size-4 text-pink-600" />
                        Tenant Conversion
                    </p>
                    {request.converted_organization ? (
                        <StatusBadge status={request.converted_organization.status} />
                    ) : (
                        <StatusBadge status="not_converted" />
                    )}
                </div>
                {request.converted_organization ? (
                    <p className="text-muted-foreground text-sm">
                        Converted to {request.converted_organization.name} at {request.converted_at ?? 'conversion time unavailable'}.
                    </p>
                ) : (
                    <form onSubmit={convert} className="grid gap-3 md:grid-cols-[1fr_0.8fr_0.8fr_auto] md:items-end">
                        <Select
                            label="Plan"
                            value={String(convertForm.data.subscription_plan_id)}
                            options={plans.map((plan) => String(plan.id))}
                            labels={Object.fromEntries(plans.map((plan) => [String(plan.id), `${plan.name} (${plan.code})`]))}
                            onChange={(value) => convertForm.setData('subscription_plan_id', value ? Number(value) : '')}
                        />
                        <Select
                            label="Cycle"
                            value={convertForm.data.billing_cycle}
                            options={['monthly', 'quarterly', 'annual', 'manual']}
                            onChange={(value) => convertForm.setData('billing_cycle', value)}
                        />
                        <Field
                            label="Trial Ends"
                            type="date"
                            value={convertForm.data.trial_ends_at}
                            onChange={(value) => convertForm.setData('trial_ends_at', value)}
                        />
                        <Button disabled={convertForm.processing || plans.length === 0}>Convert</Button>
                    </form>
                )}
            </div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <Card>
            <CardContent className="p-4">
                <p className="text-muted-foreground text-sm">{label}</p>
                <p className="mt-1 text-2xl font-semibold">{value}</p>
            </CardContent>
        </Card>
    );
}

function Info({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-1 font-semibold capitalize">{value}</p>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    type = 'text',
}: {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    type?: string;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
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
