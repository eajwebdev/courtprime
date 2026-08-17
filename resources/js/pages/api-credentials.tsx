import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'API Keys', href: '/api-credentials' }];
const endpoints = [
    ['courts:read', 'GET /api/courtprime/v1/courts'],
    ['reservations:read', 'GET /api/courtprime/v1/reservations'],
    ['scores:read', 'GET /api/courtprime/v1/scores'],
    ['tournaments:read', 'GET /api/courtprime/v1/tournaments'],
    ['players:read', 'GET /api/courtprime/v1/players'],
    ['rankings:read', 'GET /api/courtprime/v1/rankings'],
];

export default function ApiCredentials({ enabled, credentials, abilities }: { enabled: boolean; credentials: any; abilities: string[] }) {
    const { flash } = usePage<SharedData>().props as SharedData & { flash?: { api_token_once?: string; success?: string } };
    const form = useForm({
        name: '',
        abilities: ['reservations:read', 'courts:read'],
        expires_at: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/api-credentials', { preserveScroll: true, onSuccess: () => form.reset('name', 'expires_at') });
    };

    const toggleAbility = (ability: string, checked: boolean) => {
        const next = checked ? Array.from(new Set([...form.data.abilities, ability])) : form.data.abilities.filter((item) => item !== ability);
        form.setData('abilities', next.length ? next : [ability]);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="API Keys" />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[0.9fr_1.5fr]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <KeyRound className="size-4 text-pink-600" />
                                New API Credential
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!enabled && (
                                <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                    API access is not enabled for this organization yet.
                                </p>
                            )}
                            {flash?.api_token_once && (
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                    <p className="text-sm font-semibold text-emerald-900">Copy this token now</p>
                                    <p className="mt-2 rounded-md bg-white p-2 font-mono text-xs break-all text-emerald-950">
                                        {flash.api_token_once}
                                    </p>
                                </div>
                            )}
                            <form onSubmit={submit} className="space-y-4">
                                <Field
                                    label="Name"
                                    value={form.data.name}
                                    onChange={(value) => form.setData('name', value)}
                                    error={form.errors.name}
                                />
                                <Field
                                    label="Expires At"
                                    type="date"
                                    value={form.data.expires_at}
                                    onChange={(value) => form.setData('expires_at', value)}
                                    error={form.errors.expires_at}
                                />
                                <div className="space-y-2">
                                    <Label>Abilities</Label>
                                    <div className="grid gap-2">
                                        {abilities.map((ability) => (
                                            <label key={ability} className="flex h-10 items-center gap-3 rounded-md border px-3 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={form.data.abilities.includes(ability)}
                                                    onChange={(event) => toggleAbility(ability, event.target.checked)}
                                                />
                                                <span>{ability}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {form.errors.abilities && <p className="text-xs text-red-600">{form.errors.abilities}</p>}
                                </div>
                                <Button disabled={!enabled || form.processing}>Create API Key</Button>
                            </form>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Read API Endpoints</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {endpoints.map(([ability, endpoint]) => (
                                <div key={ability} className="grid gap-2 rounded-lg border p-3 text-sm md:grid-cols-[10rem_1fr]">
                                    <span className="text-muted-foreground font-mono text-xs">{ability}</span>
                                    <span className="font-mono break-all">{endpoint}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Credentials</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {credentials.data.map((credential: any) => (
                            <div key={credential.id} className="rounded-lg border p-3">
                                <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                                    <div>
                                        <p className="font-semibold">{credential.name}</p>
                                        <p className="text-muted-foreground font-mono text-sm">{credential.token_prefix}...</p>
                                    </div>
                                    <StatusBadge status={credential.status} />
                                    <Button
                                        variant="outline"
                                        disabled={credential.status === 'revoked'}
                                        onClick={() => router.post(`/api-credentials/${credential.id}/revoke`, {}, { preserveScroll: true })}
                                    >
                                        Revoke
                                    </Button>
                                </div>
                                <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                                    <Info label="Abilities" value={(credential.abilities ?? []).join(', ')} />
                                    <Info label="Created By" value={credential.creator?.name ?? '-'} />
                                    <Info label="Expires" value={credential.expires_at ?? 'Never'} />
                                </div>
                            </div>
                        ))}
                        {credentials.data.length === 0 && (
                            <p className="text-muted-foreground rounded-lg border p-4 text-sm">No API credentials have been created yet.</p>
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
            <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}

function Info({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-1 font-semibold break-words">{value}</p>
        </div>
    );
}
