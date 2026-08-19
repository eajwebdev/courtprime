import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { currency } from '@/lib/format';
import { serverError } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Wrench } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Maintenance', href: '/maintenance' }];

export default function Maintenance({
    workOrders,
    branches,
    courts,
    staff,
    canManageMaintenance,
}: {
    workOrders: any;
    branches: any[];
    courts: any[];
    staff: any[];
    canManageMaintenance: boolean;
}) {
    const form = useForm({
        branch_id: branches[0]?.id ?? '',
        court_id: '',
        assigned_to: '',
        title: '',
        priority: 'normal',
        status: 'open',
        scheduled_date: new Date().toISOString().slice(0, 10),
        start_time: '09:00',
        end_time: '10:00',
        estimated_cost: 0,
        description: '',
        block_court: true as boolean,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            branch_id: Number(data.branch_id),
            court_id: data.court_id ? Number(data.court_id) : null,
            assigned_to: data.assigned_to ? Number(data.assigned_to) : null,
            estimated_cost: Number(data.estimated_cost),
        }));
        form.post('/maintenance', { preserveScroll: true, onSuccess: () => form.reset('title', 'description') });
    };

    const branchCourts = courts.filter((court) => Number(court.branch_id) === Number(form.data.branch_id));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Maintenance" />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[0.95fr_1.5fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Wrench className="size-4 text-pink-600" />
                            New Work Order
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <Field
                                label="Title"
                                value={form.data.title}
                                onChange={(value) => form.setData('title', value)}
                                error={form.errors.title}
                            />
                            <div className="grid gap-3 md:grid-cols-2">
                                <Select
                                    label="Branch"
                                    value={String(form.data.branch_id)}
                                    options={branches.map((branch) => String(branch.id))}
                                    labels={Object.fromEntries(branches.map((branch) => [branch.id, `${branch.code} - ${branch.name}`]))}
                                    onChange={(value) => form.setData('branch_id', Number(value))}
                                />
                                <Select
                                    label="Court"
                                    value={String(form.data.court_id)}
                                    options={['', ...branchCourts.map((court) => String(court.id))]}
                                    labels={Object.fromEntries([
                                        ['', 'No specific court'],
                                        ...branchCourts.map((court) => [String(court.id), court.name]),
                                    ])}
                                    onChange={(value) => form.setData('court_id', value)}
                                />
                                <Select
                                    label="Priority"
                                    value={form.data.priority}
                                    options={['low', 'normal', 'high', 'urgent']}
                                    onChange={(value) => form.setData('priority', value)}
                                />
                                <Select
                                    label="Status"
                                    value={form.data.status}
                                    options={['open', 'scheduled', 'in_progress']}
                                    onChange={(value) => form.setData('status', value)}
                                />
                                <Field
                                    label="Date"
                                    type="date"
                                    value={form.data.scheduled_date}
                                    onChange={(value) => form.setData('scheduled_date', value)}
                                    error={form.errors.scheduled_date}
                                />
                                <Field
                                    label="Start"
                                    type="time"
                                    value={form.data.start_time}
                                    onChange={(value) => form.setData('start_time', value)}
                                    error={form.errors.start_time}
                                />
                                <Field
                                    label="End"
                                    type="time"
                                    value={form.data.end_time}
                                    onChange={(value) => form.setData('end_time', value)}
                                    error={form.errors.end_time}
                                />
                                <Field
                                    label="Estimate"
                                    type="number"
                                    value={form.data.estimated_cost}
                                    onChange={(value) => form.setData('estimated_cost', Number(value))}
                                    error={form.errors.estimated_cost}
                                />
                                <Select
                                    label="Assigned To"
                                    value={String(form.data.assigned_to)}
                                    options={['', ...staff.map((person) => String(person.id))]}
                                    labels={Object.fromEntries([
                                        ['', 'Unassigned'],
                                        ...staff.map((person) => [String(person.id), `${person.name} (${person.role_key})`]),
                                    ])}
                                    onChange={(value) => form.setData('assigned_to', value)}
                                />
                            </div>
                            <label className="flex h-10 items-center gap-3 rounded-md border px-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.data.block_court}
                                    onChange={(event) => form.setData('block_court', event.target.checked)}
                                />
                                <span>Block court availability</span>
                            </label>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <textarea
                                    className="bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
                                    value={form.data.description}
                                    onChange={(event) => form.setData('description', event.target.value)}
                                />
                                {form.errors.description && <p className="text-xs text-red-600">{form.errors.description}</p>}
                                {serverError(form.errors, 'subscription') && (
                                    <p className="text-xs text-red-600">{serverError(form.errors, 'subscription')}</p>
                                )}
                            </div>
                            <Button disabled={form.processing || branches.length === 0}>Create Work Order</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Maintenance Board</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {workOrders.data.map((workOrder: any) => (
                            <WorkOrderCard key={workOrder.id} workOrder={workOrder} canManageMaintenance={canManageMaintenance} />
                        ))}
                        {workOrders.data.length === 0 && (
                            <p className="text-muted-foreground rounded-lg border p-4 text-sm">No maintenance work orders yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function WorkOrderCard({ workOrder, canManageMaintenance }: { workOrder: any; canManageMaintenance: boolean }) {
    const form = useForm({
        status: workOrder.status,
        actual_cost: workOrder.actual_cost ?? 0,
        resolution_notes: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({ ...data, actual_cost: Number(data.actual_cost) }));
        form.post(`/maintenance/${workOrder.id}`, { preserveScroll: true });
    };

    return (
        <div className="rounded-lg border p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-start">
                <div>
                    <p className="text-xs font-semibold text-pink-600">{workOrder.reference}</p>
                    <p className="mt-1 font-semibold">{workOrder.title}</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {workOrder.branch?.name} - {workOrder.court?.name ?? 'General facility'} - {workOrder.scheduled_date ?? 'Unscheduled'}
                    </p>
                    {workOrder.description && <p className="mt-3 text-sm">{workOrder.description}</p>}
                </div>
                <StatusBadge status={workOrder.priority} />
                <StatusBadge status={workOrder.status} />
            </div>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                <Info label="Assigned" value={workOrder.assignee?.name ?? 'Unassigned'} />
                <Info label="Estimate" value={currency(workOrder.estimated_cost)} />
                <Info label="Actual" value={currency(workOrder.actual_cost)} />
            </div>
            {canManageMaintenance && (
                <form
                    onSubmit={submit}
                    className="bg-surface-muted/40 mt-4 grid gap-3 rounded-lg p-3 md:grid-cols-[0.7fr_0.7fr_1fr_auto] md:items-end"
                >
                    <Select
                        label="Status"
                        value={form.data.status}
                        options={['open', 'scheduled', 'in_progress', 'completed', 'cancelled']}
                        onChange={(value) => form.setData('status', value)}
                    />
                    <Field
                        label="Actual Cost"
                        type="number"
                        value={form.data.actual_cost}
                        onChange={(value) => form.setData('actual_cost', Number(value))}
                        error={form.errors.actual_cost}
                    />
                    <Field
                        label="Resolution"
                        value={form.data.resolution_notes}
                        onChange={(value) => form.setData('resolution_notes', value)}
                        error={form.errors.resolution_notes}
                    />
                    <Button disabled={form.processing}>Update</Button>
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

function Info({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
        </div>
    );
}
