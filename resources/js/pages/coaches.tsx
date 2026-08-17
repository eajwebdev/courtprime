import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { currency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Coaches', href: '/coaches' }];

export default function Coaches({ coaches, branches }: { coaches: any; branches: any[] }) {
    const form = useForm({
        branch_id: '',
        name: '',
        email: '',
        mobile_number: '',
        specialties: '',
        hourly_rate: 0,
        bio: '',
        status: 'active',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/coaches', { preserveScroll: true, onSuccess: () => form.reset('name', 'email', 'mobile_number', 'specialties', 'bio') });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Coaches" />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[0.9fr_1.5fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <GraduationCap className="size-4 text-pink-600" />
                            New Coach
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <Field label="Name" value={form.data.name} onChange={(value) => form.setData('name', value)} error={form.errors.name} />
                            <div className="grid grid-cols-2 gap-3">
                                <Field
                                    label="Email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(value) => form.setData('email', value)}
                                    error={form.errors.email}
                                />
                                <Field
                                    label="Mobile"
                                    value={form.data.mobile_number}
                                    onChange={(value) => form.setData('mobile_number', value)}
                                    error={form.errors.mobile_number}
                                />
                                <Field
                                    label="Hourly Rate"
                                    type="number"
                                    value={form.data.hourly_rate}
                                    onChange={(value) => form.setData('hourly_rate', Number(value))}
                                    error={form.errors.hourly_rate}
                                />
                                <Select
                                    label="Status"
                                    value={form.data.status}
                                    options={['active', 'inactive', 'on_leave']}
                                    onChange={(value) => form.setData('status', value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Branch</Label>
                                <select
                                    className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                                    value={form.data.branch_id}
                                    onChange={(event) => form.setData('branch_id', event.target.value)}
                                >
                                    <option value="">All branches</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.code} - {branch.name}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.branch_id && <p className="text-xs text-red-600">{form.errors.branch_id}</p>}
                            </div>
                            <Field
                                label="Specialties"
                                value={form.data.specialties}
                                onChange={(value) => form.setData('specialties', value)}
                                error={form.errors.specialties}
                            />
                            <div className="space-y-2">
                                <Label>Bio</Label>
                                <textarea
                                    className="bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
                                    value={form.data.bio}
                                    onChange={(event) => form.setData('bio', event.target.value)}
                                />
                                {form.errors.bio && <p className="text-xs text-red-600">{form.errors.bio}</p>}
                            </div>
                            <Button disabled={form.processing} className="w-full">
                                Save Coach
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Coaching Directory</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {coaches.data.map((coach: any) => (
                            <div key={coach.id} className="rounded-lg border p-4">
                                <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                                    <div>
                                        <p className="font-semibold">{coach.name}</p>
                                        <p className="text-muted-foreground text-sm">
                                            {coach.branch?.name ?? 'All branches'} - {coach.email ?? coach.mobile_number ?? 'No contact'}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold">{currency(coach.hourly_rate)} / hr</p>
                                    <StatusBadge status={coach.status} />
                                </div>
                                {coach.specialties?.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {coach.specialties.map((specialty: string) => (
                                            <StatusBadge key={specialty} status={specialty} />
                                        ))}
                                    </div>
                                )}
                                {coach.bio && <p className="text-muted-foreground mt-3 text-sm">{coach.bio}</p>}
                            </div>
                        ))}
                        {coaches.data.length === 0 && (
                            <p className="text-muted-foreground rounded-lg border p-4 text-sm">No coaches have been added yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
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
