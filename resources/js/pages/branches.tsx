import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Building2, Clock, MapPin } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Branches', href: '/branches' }];

export default function Branches({ branches }: { branches: any[] }) {
    const form = useForm({
        name: '',
        code: '',
        address: '',
        contact_number: '',
        email: '',
        manager_name: '',
        timezone: 'Asia/Manila',
        currency: 'PHP',
        tax_rate: 0,
        opens_at: '06:00',
        closes_at: '23:00',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({ ...data, code: data.code.toUpperCase(), currency: data.currency.toUpperCase() })).post('/branches', {
            preserveScroll: true,
            onSuccess: () => form.reset('name', 'code', 'address', 'contact_number', 'email', 'manager_name'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Branches" />
            <div className="space-y-6 p-4 md:p-6">
                <PageTitle title="Multi-Branch Control" subtitle="Manage locations, operating hours, tax setup, court counts, and branch status." />
                <div className="grid gap-6 xl:grid-cols-[0.9fr_1.6fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Building2 className="size-4 text-pink-600" />
                                New Branch
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Field
                                        label="Branch Name"
                                        value={form.data.name}
                                        onChange={(value) => form.setData('name', value)}
                                        error={form.errors.name}
                                    />
                                    <Field
                                        label="Code"
                                        value={form.data.code}
                                        onChange={(value) => form.setData('code', value)}
                                        error={form.errors.code}
                                    />
                                </div>
                                <Field
                                    label="Address"
                                    value={form.data.address}
                                    onChange={(value) => form.setData('address', value)}
                                    error={form.errors.address}
                                />
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Field
                                        label="Phone"
                                        value={form.data.contact_number}
                                        onChange={(value) => form.setData('contact_number', value)}
                                        error={form.errors.contact_number}
                                    />
                                    <Field
                                        label="Email"
                                        type="email"
                                        value={form.data.email}
                                        onChange={(value) => form.setData('email', value)}
                                        error={form.errors.email}
                                    />
                                    <Field
                                        label="Manager"
                                        value={form.data.manager_name}
                                        onChange={(value) => form.setData('manager_name', value)}
                                        error={form.errors.manager_name}
                                    />
                                    <Field
                                        label="Timezone"
                                        value={form.data.timezone}
                                        onChange={(value) => form.setData('timezone', value)}
                                        error={form.errors.timezone}
                                    />
                                    <Field
                                        label="Currency"
                                        value={form.data.currency}
                                        onChange={(value) => form.setData('currency', value)}
                                        error={form.errors.currency}
                                    />
                                    <Field
                                        label="Tax %"
                                        type="number"
                                        value={form.data.tax_rate}
                                        onChange={(value) => form.setData('tax_rate', Number(value))}
                                        error={form.errors.tax_rate}
                                    />
                                    <Field
                                        label="Opens"
                                        type="time"
                                        value={form.data.opens_at}
                                        onChange={(value) => form.setData('opens_at', value)}
                                        error={form.errors.opens_at}
                                    />
                                    <Field
                                        label="Closes"
                                        type="time"
                                        value={form.data.closes_at}
                                        onChange={(value) => form.setData('closes_at', value)}
                                        error={form.errors.closes_at}
                                    />
                                </div>
                                <Button disabled={form.processing} className="w-full">
                                    Save Branch
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 lg:grid-cols-2">
                        {branches.map((branch) => (
                            <Card key={branch.id}>
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-pink-600">{branch.code}</p>
                                            <h2 className="mt-1 text-xl font-semibold">{branch.name}</h2>
                                        </div>
                                        <StatusBadge status={branch.status} />
                                    </div>
                                    <p className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
                                        <MapPin className="size-4" />
                                        {branch.address ?? 'No address saved'}
                                    </p>
                                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                                        <Metric label="Courts" value={branch.courts_count} />
                                        <Metric label="Reservations" value={branch.reservations_count} />
                                        <Metric label="Tax" value={`${branch.tax_rate}%`} />
                                        <Metric label="Currency" value={branch.currency} />
                                    </div>
                                    <div className="dark:bg-surface-muted mt-5 rounded-lg bg-slate-50 p-3 text-sm">
                                        <p className="text-muted-foreground flex items-center gap-2">
                                            <Clock className="size-4" />
                                            {branch.operating_hours?.opens ?? '06:00'} - {branch.operating_hours?.closes ?? '23:00'} local time
                                        </p>
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

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
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
