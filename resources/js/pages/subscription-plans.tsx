import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { currency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { CreditCard, ListChecks } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Subscription Plans', href: '/subscription-plans' }];

export default function SubscriptionPlans({ plans }: { plans: any[] }) {
    const form = useForm({
        name: '',
        code: '',
        description: '',
        monthly_price: 0,
        quarterly_price: '',
        annual_price: '',
        branch_limit: '',
        court_limit: '',
        staff_limit: '',
        is_active: true as boolean,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            code: data.code.toUpperCase(),
            monthly_price: Number(data.monthly_price),
            quarterly_price: data.quarterly_price === '' ? null : Number(data.quarterly_price),
            annual_price: data.annual_price === '' ? null : Number(data.annual_price),
            branch_limit: data.branch_limit === '' ? null : Number(data.branch_limit),
            court_limit: data.court_limit === '' ? null : Number(data.court_limit),
            staff_limit: data.staff_limit === '' ? null : Number(data.staff_limit),
        }));
        form.post('/subscription-plans', { preserveScroll: true, onSuccess: () => form.reset() });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Subscription Plans" />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[0.85fr_1.5fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CreditCard className="size-4 text-pink-600" />
                            New Plan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <Field label="Name" value={form.data.name} onChange={(value) => form.setData('name', value)} error={form.errors.name} />
                            <Field label="Code" value={form.data.code} onChange={(value) => form.setData('code', value)} error={form.errors.code} />
                            <div className="grid gap-3 md:grid-cols-3">
                                <Field
                                    label="Monthly"
                                    type="number"
                                    value={form.data.monthly_price}
                                    onChange={(value) => form.setData('monthly_price', Number(value))}
                                    error={form.errors.monthly_price}
                                />
                                <Field
                                    label="Quarterly"
                                    type="number"
                                    value={form.data.quarterly_price}
                                    onChange={(value) => form.setData('quarterly_price', value)}
                                    error={form.errors.quarterly_price}
                                />
                                <Field
                                    label="Annual"
                                    type="number"
                                    value={form.data.annual_price}
                                    onChange={(value) => form.setData('annual_price', value)}
                                    error={form.errors.annual_price}
                                />
                            </div>
                            <div className="grid gap-3 md:grid-cols-3">
                                <Field
                                    label="Branches"
                                    type="number"
                                    value={form.data.branch_limit}
                                    onChange={(value) => form.setData('branch_limit', value)}
                                    error={form.errors.branch_limit}
                                />
                                <Field
                                    label="Courts"
                                    type="number"
                                    value={form.data.court_limit}
                                    onChange={(value) => form.setData('court_limit', value)}
                                    error={form.errors.court_limit}
                                />
                                <Field
                                    label="Staff"
                                    type="number"
                                    value={form.data.staff_limit}
                                    onChange={(value) => form.setData('staff_limit', value)}
                                    error={form.errors.staff_limit}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <textarea
                                    className="bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
                                    value={form.data.description}
                                    onChange={(event) => form.setData('description', event.target.value)}
                                />
                                {form.errors.description && <p className="text-xs text-red-600">{form.errors.description}</p>}
                            </div>
                            <Toggle label="Active plan" checked={form.data.is_active} onChange={(checked) => form.setData('is_active', checked)} />
                            <Button disabled={form.processing || !form.data.name || !form.data.code} className="w-full">
                                Create Plan
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    {plans.map((plan) => (
                        <PlanCard key={plan.id} plan={plan} />
                    ))}
                    {plans.length === 0 && (
                        <Card>
                            <CardContent className="text-muted-foreground p-6 text-sm">No subscription plans have been configured yet.</CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function PlanCard({ plan }: { plan: any }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex flex-wrap items-start justify-between gap-3 text-base">
                    <div>
                        <span>{plan.name}</span>
                        <p className="text-muted-foreground mt-1 text-sm font-normal">{plan.code}</p>
                    </div>
                    <StatusBadge status={plan.is_active ? 'active' : 'inactive'} />
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-5">
                    <Info label="Monthly" value={currency(plan.monthly_price)} />
                    <Info label="Branches" value={plan.branch_limit ?? 'Custom'} />
                    <Info label="Courts" value={plan.court_limit ?? 'Custom'} />
                    <Info label="Staff" value={plan.staff_limit ?? 'Custom'} />
                    <Info label="Subscribers" value={plan.subscriptions_count} />
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                    {plan.features.map((feature: any) => (
                        <div key={feature.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                            <div>
                                <p className="font-semibold">{feature.label}</p>
                                <p className="text-muted-foreground">{feature.feature_key}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {feature.limit_value && (
                                    <span className="bg-surface-muted rounded-full px-2 py-1 text-xs">Limit {feature.limit_value}</span>
                                )}
                                <StatusBadge status={feature.enabled ? 'active' : 'inactive'} />
                            </div>
                        </div>
                    ))}
                </div>

                <FeatureForm plan={plan} />
            </CardContent>
        </Card>
    );
}

function FeatureForm({ plan }: { plan: any }) {
    const form = useForm({
        feature_key: '',
        label: '',
        enabled: true as boolean,
        limit_value: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            limit_value: data.limit_value === '' ? null : Number(data.limit_value),
        }));
        form.post(`/subscription-plans/${plan.id}/features`, {
            preserveScroll: true,
            onSuccess: () => form.reset('feature_key', 'label', 'limit_value'),
        });
    };

    return (
        <form onSubmit={submit} className="rounded-lg border p-3">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <ListChecks className="size-4 text-pink-600" />
                Feature Flag / Limit
            </p>
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_0.7fr_auto] md:items-end">
                <Field
                    label="Feature Key"
                    value={form.data.feature_key}
                    onChange={(value) => form.setData('feature_key', value)}
                    error={form.errors.feature_key}
                />
                <Field label="Label" value={form.data.label} onChange={(value) => form.setData('label', value)} error={form.errors.label} />
                <Field
                    label="Limit"
                    type="number"
                    value={form.data.limit_value}
                    onChange={(value) => form.setData('limit_value', value)}
                    error={form.errors.limit_value}
                />
                <Button disabled={form.processing || !form.data.feature_key || !form.data.label}>Save</Button>
            </div>
            <div className="mt-3">
                <Toggle label="Enabled" checked={form.data.enabled} onChange={(checked) => form.setData('enabled', checked)} />
            </div>
        </form>
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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
    return (
        <label className="flex h-10 items-center gap-3 rounded-md border px-3 text-sm">
            <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
            <span>{label}</span>
        </label>
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
