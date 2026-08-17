import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { currency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { BadgeCheck, FileText, Ticket } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Memberships', href: '/memberships' }];

export default function Memberships({
    plans,
    memberships,
    players,
    waiverTemplates,
}: {
    plans: any[];
    memberships: any;
    players: any[];
    waiverTemplates: any[];
}) {
    const planForm = useForm({
        name: '',
        code: '',
        duration_days: 30,
        price: 0,
        benefits: '',
        status: 'active',
    });

    const membershipForm = useForm({
        membership_plan_id: plans[0]?.id ?? '',
        organization_player_id: players[0]?.id ?? '',
        starts_on: new Date().toISOString().slice(0, 10),
        auto_renew: false,
        notes: '',
    });

    const waiverTemplateForm = useForm({
        title: '',
        version: 'v1',
        body: '',
        required_before_booking: false,
        status: 'active',
    });

    const createPlan = (event: FormEvent) => {
        event.preventDefault();
        planForm
            .transform((data) => ({ ...data, code: data.code.toUpperCase() }))
            .post('/membership-plans', {
                preserveScroll: true,
                onSuccess: () => planForm.reset('name', 'code', 'benefits'),
            });
    };

    const assignMembership = (event: FormEvent) => {
        event.preventDefault();
        membershipForm.post('/player-memberships', { preserveScroll: true, onSuccess: () => membershipForm.reset('notes') });
    };

    const createWaiverTemplate = (event: FormEvent) => {
        event.preventDefault();
        waiverTemplateForm.post('/waiver-templates', {
            preserveScroll: true,
            onSuccess: () => waiverTemplateForm.reset('title', 'body'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Memberships" />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[0.95fr_1.6fr]">
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Ticket className="size-4 text-pink-600" />
                                New Plan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={createPlan} className="space-y-4">
                                <Field
                                    label="Plan Name"
                                    value={planForm.data.name}
                                    onChange={(value) => planForm.setData('name', value)}
                                    error={planForm.errors.name}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field
                                        label="Code"
                                        value={planForm.data.code}
                                        onChange={(value) => planForm.setData('code', value)}
                                        error={planForm.errors.code}
                                    />
                                    <Field
                                        label="Days"
                                        type="number"
                                        value={planForm.data.duration_days}
                                        onChange={(value) => planForm.setData('duration_days', Number(value))}
                                        error={planForm.errors.duration_days}
                                    />
                                    <Field
                                        label="Price"
                                        type="number"
                                        value={planForm.data.price}
                                        onChange={(value) => planForm.setData('price', Number(value))}
                                        error={planForm.errors.price}
                                    />
                                    <Select
                                        label="Status"
                                        value={planForm.data.status}
                                        options={['active', 'inactive']}
                                        onChange={(value) => planForm.setData('status', value)}
                                    />
                                </div>
                                <Field
                                    label="Benefits"
                                    value={planForm.data.benefits}
                                    onChange={(value) => planForm.setData('benefits', value)}
                                    error={planForm.errors.benefits}
                                />
                                <Button disabled={planForm.processing} className="w-full">
                                    Save Plan
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BadgeCheck className="size-4 text-pink-600" />
                                Assign Membership
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={assignMembership} className="space-y-4">
                                <Select
                                    label="Plan"
                                    value={String(membershipForm.data.membership_plan_id)}
                                    options={plans.map((plan) => String(plan.id))}
                                    labels={Object.fromEntries(plans.map((plan) => [String(plan.id), `${plan.name} - ${currency(plan.price)}`]))}
                                    onChange={(value) => membershipForm.setData('membership_plan_id', Number(value))}
                                />
                                <Select
                                    label="Player"
                                    value={String(membershipForm.data.organization_player_id)}
                                    options={players.map((player) => String(player.id))}
                                    labels={Object.fromEntries(
                                        players.map((player) => [String(player.id), `${player.name} (${player.courtprime_player_id})`]),
                                    )}
                                    onChange={(value) => membershipForm.setData('organization_player_id', Number(value))}
                                />
                                <Field
                                    label="Starts"
                                    type="date"
                                    value={membershipForm.data.starts_on}
                                    onChange={(value) => membershipForm.setData('starts_on', value)}
                                    error={membershipForm.errors.starts_on}
                                />
                                <label className="flex h-10 items-center gap-3 rounded-md border px-3 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={membershipForm.data.auto_renew}
                                        onChange={(event) => membershipForm.setData('auto_renew', event.target.checked)}
                                    />
                                    <span>Auto renew</span>
                                </label>
                                <Button disabled={membershipForm.processing || plans.length === 0 || players.length === 0} className="w-full">
                                    Assign Plan
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileText className="size-4 text-pink-600" />
                                Waiver Template
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={createWaiverTemplate} className="space-y-4">
                                <Field
                                    label="Title"
                                    value={waiverTemplateForm.data.title}
                                    onChange={(value) => waiverTemplateForm.setData('title', value)}
                                    error={waiverTemplateForm.errors.title}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field
                                        label="Version"
                                        value={waiverTemplateForm.data.version}
                                        onChange={(value) => waiverTemplateForm.setData('version', value)}
                                        error={waiverTemplateForm.errors.version}
                                    />
                                    <Select
                                        label="Status"
                                        value={waiverTemplateForm.data.status}
                                        options={['active', 'inactive', 'archived']}
                                        onChange={(value) => waiverTemplateForm.setData('status', value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Body</Label>
                                    <textarea
                                        className="bg-background min-h-28 w-full rounded-md border px-3 py-2 text-sm"
                                        value={waiverTemplateForm.data.body}
                                        onChange={(event) => waiverTemplateForm.setData('body', event.target.value)}
                                    />
                                    {waiverTemplateForm.errors.body && <p className="text-xs text-red-600">{waiverTemplateForm.errors.body}</p>}
                                </div>
                                <label className="flex h-10 items-center gap-3 rounded-md border px-3 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={waiverTemplateForm.data.required_before_booking}
                                        onChange={(event) => waiverTemplateForm.setData('required_before_booking', event.target.checked)}
                                    />
                                    <span>Require before booking</span>
                                </label>
                                <Button disabled={waiverTemplateForm.processing} className="w-full">
                                    Save Waiver Template
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Membership Ledger</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {memberships.data.map((membership: any) => (
                                <div key={membership.id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                                    <div>
                                        <p className="font-semibold">{membership.organization_player?.player_profile?.display_name}</p>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            {membership.plan?.name} - {membership.starts_on} to {membership.ends_on ?? 'Ongoing'}
                                        </p>
                                    </div>
                                    <StatusBadge status={membership.status} />
                                    <p className="text-right text-sm font-semibold">{currency(membership.plan?.price)}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Waiver Templates</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {waiverTemplates.map((template) => (
                                <div key={template.id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                                    <div>
                                        <p className="font-semibold">{template.title}</p>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            {template.version} - {template.accepted_waivers_count} accepted waivers
                                        </p>
                                    </div>
                                    {template.required_before_booking && <StatusBadge status="required" />}
                                    <StatusBadge status={template.status} />
                                </div>
                            ))}
                            {waiverTemplates.length === 0 && (
                                <p className="text-muted-foreground rounded-lg border p-4 text-sm">No reusable waiver templates yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
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
                className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {labels?.[option] ?? option}
                    </option>
                ))}
            </select>
        </div>
    );
}
