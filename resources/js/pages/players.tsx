import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { currency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { IdCard, Star, UserRoundPlus, WalletCards } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Players', href: '/players' }];

export default function Players({ players, metrics }: { players: any; metrics: Record<string, number> }) {
    const form = useForm({
        name: '',
        email: '',
        mobile_number: '',
        emergency_contact: '',
        birthdate: '',
        rating: 2.5,
        skill_level: 'beginner',
        membership_status: 'guest',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/players', { preserveScroll: true, onSuccess: () => form.reset() });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Players" />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[0.8fr_1.6fr]">
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Player Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-3">
                            <Metric label="Total" value={metrics.total} />
                            <Metric label="Members" value={metrics.members} />
                            <Metric label="Guests" value={metrics.guests} />
                            <Metric label="Avg Rating" value={metrics.averageRating} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <UserRoundPlus className="size-4 text-pink-600" />
                                New Player
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <Field
                                    label="Name"
                                    value={form.data.name}
                                    onChange={(value) => form.setData('name', value)}
                                    error={form.errors.name}
                                />
                                <Field
                                    label="Email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(value) => form.setData('email', value)}
                                    error={form.errors.email}
                                />
                                <Field label="Mobile" value={form.data.mobile_number} onChange={(value) => form.setData('mobile_number', value)} />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field
                                        label="Rating"
                                        type="number"
                                        value={form.data.rating}
                                        onChange={(value) => form.setData('rating', Number(value))}
                                    />
                                    <div className="space-y-2">
                                        <Label>Skill</Label>
                                        <select
                                            className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                                            value={form.data.skill_level}
                                            onChange={(event) => form.setData('skill_level', event.target.value)}
                                        >
                                            {['beginner', 'intermediate', 'advanced', 'competitive'].map((item) => (
                                                <option key={item} value={item}>
                                                    {item}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <Button disabled={form.processing} className="w-full">
                                    Save Player
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Player Directory</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {players.data.map((player: any) => (
                            <div key={player.id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold">{player.name}</p>
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                            {player.courtprime_player_id}
                                        </span>
                                        <StatusBadge status={player.membership_status} />
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-sm">{player.email ?? player.mobile_number ?? 'No contact saved'}</p>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Star className="size-4 text-pink-600" />
                                    <strong>{player.rating}</strong>
                                    <span className="text-muted-foreground capitalize">{player.skill_level}</span>
                                </div>
                                <div className="text-right text-sm">
                                    <p className="flex items-center justify-end gap-1 font-semibold">
                                        <WalletCards className="size-4" />
                                        {currency(player.wallet_balance)}
                                    </p>
                                    <p className="text-muted-foreground">{player.total_reservations} reservations</p>
                                </div>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/players/${player.organization_player_id}`}>
                                        <IdCard className="size-4" />
                                        Identity
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-sm">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
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
