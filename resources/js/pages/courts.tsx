import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { currency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { BadgeCheck, Building2, Gauge, PlusCircle } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Courts', href: '/courts' }];

export default function Courts({ courts, branches }: { courts: any[]; branches: any[] }) {
    const form = useForm({
        branch_id: branches[0]?.id ?? '',
        name: '',
        court_number: 1,
        court_type: 'standard',
        environment: 'indoor',
        surface_type: 'acrylic',
        capacity: 4,
        standard_hourly_rate: 0,
        peak_hourly_rate: 0,
        off_peak_hourly_rate: 0,
        member_hourly_rate: 0,
        guest_hourly_rate: 0,
        amenities: '',
        status: 'available',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/courts', {
            preserveScroll: true,
            onSuccess: () => form.reset('name', 'amenities'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Courts" />
            <div className="space-y-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold">Court Management</h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Track rates, statuses, amenities, utilization, and live readiness across every branch.
                    </p>
                </div>
                <div className="grid gap-6 xl:grid-cols-[0.95fr_1.7fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <PlusCircle className="size-4 text-pink-600" />
                                New Court
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Branch</Label>
                                    <select
                                        className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                                        value={form.data.branch_id}
                                        onChange={(event) => form.setData('branch_id', Number(event.target.value))}
                                    >
                                        {branches.map((branch) => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.branch_id && <p className="text-xs text-red-600">{form.errors.branch_id}</p>}
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Field
                                        label="Court Name"
                                        value={form.data.name}
                                        onChange={(value) => form.setData('name', value)}
                                        error={form.errors.name}
                                    />
                                    <Field
                                        label="Number"
                                        type="number"
                                        value={form.data.court_number}
                                        onChange={(value) => form.setData('court_number', Number(value))}
                                        error={form.errors.court_number}
                                    />
                                    <Field
                                        label="Type"
                                        value={form.data.court_type}
                                        onChange={(value) => form.setData('court_type', value)}
                                        error={form.errors.court_type}
                                    />
                                    <Field
                                        label="Environment"
                                        value={form.data.environment}
                                        onChange={(value) => form.setData('environment', value)}
                                        error={form.errors.environment}
                                    />
                                    <Field
                                        label="Surface"
                                        value={form.data.surface_type}
                                        onChange={(value) => form.setData('surface_type', value)}
                                        error={form.errors.surface_type}
                                    />
                                    <Field
                                        label="Capacity"
                                        type="number"
                                        value={form.data.capacity}
                                        onChange={(value) => form.setData('capacity', Number(value))}
                                        error={form.errors.capacity}
                                    />
                                    <Field
                                        label="Standard Rate"
                                        type="number"
                                        value={form.data.standard_hourly_rate}
                                        onChange={(value) => form.setData('standard_hourly_rate', Number(value))}
                                        error={form.errors.standard_hourly_rate}
                                    />
                                    <Field
                                        label="Peak Rate"
                                        type="number"
                                        value={form.data.peak_hourly_rate}
                                        onChange={(value) => form.setData('peak_hourly_rate', Number(value))}
                                        error={form.errors.peak_hourly_rate}
                                    />
                                    <Field
                                        label="Off-Peak Rate"
                                        type="number"
                                        value={form.data.off_peak_hourly_rate}
                                        onChange={(value) => form.setData('off_peak_hourly_rate', Number(value))}
                                        error={form.errors.off_peak_hourly_rate}
                                    />
                                    <Field
                                        label="Member Rate"
                                        type="number"
                                        value={form.data.member_hourly_rate}
                                        onChange={(value) => form.setData('member_hourly_rate', Number(value))}
                                        error={form.errors.member_hourly_rate}
                                    />
                                    <Field
                                        label="Guest Rate"
                                        type="number"
                                        value={form.data.guest_hourly_rate}
                                        onChange={(value) => form.setData('guest_hourly_rate', Number(value))}
                                        error={form.errors.guest_hourly_rate}
                                    />
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <select
                                            className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                                            value={form.data.status}
                                            onChange={(event) => form.setData('status', event.target.value)}
                                        >
                                            {['available', 'reserved', 'maintenance', 'inactive'].map((status) => (
                                                <option key={status} value={status}>
                                                    {status}
                                                </option>
                                            ))}
                                        </select>
                                        {form.errors.status && <p className="text-xs text-red-600">{form.errors.status}</p>}
                                    </div>
                                </div>
                                <Field
                                    label="Amenities"
                                    value={form.data.amenities}
                                    onChange={(value) => form.setData('amenities', value)}
                                    error={form.errors.amenities}
                                />
                                <Button disabled={form.processing || branches.length === 0} className="w-full">
                                    Save Court
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2">
                        {courts.map((court) => (
                            <Card key={court.id}>
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-muted-foreground text-sm">{court.branch?.name}</p>
                                            <h2 className="mt-1 text-xl font-semibold">{court.name}</h2>
                                        </div>
                                        <StatusBadge status={court.status} />
                                    </div>
                                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                                        <Info icon={Building2} label="Type" value={court.court_type} />
                                        <Info icon={Gauge} label="Surface" value={court.surface_type} />
                                        <Info icon={BadgeCheck} label="Standard" value={currency(court.standard_hourly_rate)} />
                                        <Info icon={BadgeCheck} label="Peak" value={currency(court.peak_hourly_rate)} />
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {(court.amenities ?? []).map((amenity: string) => (
                                            <span
                                                key={amenity}
                                                className="dark:bg-surface-muted dark:text-muted-foreground rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                                            >
                                                {amenity}
                                            </span>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-muted-foreground flex items-center gap-2">
                <Icon className="size-4" />
                {label}
            </p>
            <p className="mt-1 font-semibold capitalize">{value}</p>
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
