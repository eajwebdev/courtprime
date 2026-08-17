import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { currency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Shuffle, UserCheck, UserPlus } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Open Play', href: '/open-play' }];

export default function OpenPlay({
    sessions,
    activeSession,
    recommendedGroup,
    recommendedGroups = {},
    branches,
    players,
}: {
    sessions: any;
    activeSession: any;
    recommendedGroup: any[];
    recommendedGroups: Record<string, any[]>;
    branches: any[];
    players: any[];
}) {
    const form = useForm({
        branch_id: branches[0]?.id ?? '',
        name: 'Saturday Social Open Play',
        session_date: new Date().toISOString().slice(0, 10),
        start_time: '19:00',
        end_time: '22:00',
        max_players: 32,
        min_rating: 2.5,
        max_rating: 4.5,
        entry_fee: 200,
        notes: '',
    });
    const groupForm = useForm({
        mode: 'skill_based',
        group_size: 4,
        court_id: '',
        player_ids: [] as number[],
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/open-play', { preserveScroll: true });
    };

    const join = (playerId: number) => {
        if (activeSession) {
            router.post(`/open-play/${activeSession.id}/players/${playerId}`, {}, { preserveScroll: true });
        }
    };

    const checkIn = (playerId: number) => {
        if (activeSession) {
            router.post(`/open-play/${activeSession.id}/players/${playerId}/check-in`, {}, { preserveScroll: true });
        }
    };

    const callGroup = (event: FormEvent) => {
        event.preventDefault();

        if (activeSession) {
            groupForm.post(`/open-play/${activeSession.id}/groups`, { preserveScroll: true });
        }
    };

    const toggleManualPlayer = (playerId: number) => {
        const selected = groupForm.data.player_ids.includes(playerId)
            ? groupForm.data.player_ids.filter((id) => id !== playerId)
            : [...groupForm.data.player_ids, playerId];

        groupForm.setData('player_ids', selected);
    };

    const activeRecommendation = recommendedGroups[groupForm.data.mode] ?? recommendedGroup;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Open Play" />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[0.8fr_1.5fr]">
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Create Session</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <Field label="Name" value={form.data.name} onChange={(value) => form.setData('name', value)} />
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
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <Field
                                        label="Date"
                                        type="date"
                                        value={form.data.session_date}
                                        onChange={(value) => form.setData('session_date', value)}
                                    />
                                    <Field
                                        label="Start"
                                        type="time"
                                        value={form.data.start_time}
                                        onChange={(value) => form.setData('start_time', value)}
                                    />
                                    <Field label="End" type="time" value={form.data.end_time} onChange={(value) => form.setData('end_time', value)} />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <Field
                                        label="Max"
                                        type="number"
                                        value={form.data.max_players}
                                        onChange={(value) => form.setData('max_players', Number(value))}
                                    />
                                    <Field
                                        label="Min Rating"
                                        type="number"
                                        value={form.data.min_rating}
                                        onChange={(value) => form.setData('min_rating', Number(value))}
                                    />
                                    <Field
                                        label="Fee"
                                        type="number"
                                        value={form.data.entry_fee}
                                        onChange={(value) => form.setData('entry_fee', Number(value))}
                                    />
                                </div>
                                <Button disabled={form.processing} className="w-full">
                                    Create Open Play
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Sessions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {sessions.data.map((session: any) => (
                                <div key={session.id} className="rounded-lg border p-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold">{session.name}</p>
                                            <p className="text-muted-foreground text-sm">{session.branch?.name}</p>
                                        </div>
                                        <StatusBadge status={session.status} />
                                    </div>
                                    <p className="mt-3 text-sm">
                                        {session.players_count} registered - {session.queue_count} queued - {currency(session.entry_fee)}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Shuffle className="size-4 text-pink-600" />
                                Smart Queue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {activeSession ? (
                                <div className="grid gap-4 xl:grid-cols-2">
                                    <div className="space-y-3">
                                        <p className="text-sm font-semibold">Waiting Players</p>
                                        {activeSession.queue.map((entry: any) => (
                                            <div key={entry.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                                                <div>
                                                    <p className="font-semibold">
                                                        {entry.position}. {entry.player?.name}
                                                    </p>
                                                    <p className="text-muted-foreground">Rating {entry.player?.rating}</p>
                                                </div>
                                                <StatusBadge status={entry.status} />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-3">
                                        <form onSubmit={callGroup} className="space-y-3 rounded-lg border p-3">
                                            <p className="text-sm font-semibold">Build Group</p>
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <Select
                                                    label="Mode"
                                                    value={groupForm.data.mode}
                                                    options={['skill_based', 'queue_priority', 'random', 'winner_stays', 'manual']}
                                                    onChange={(value) => groupForm.setData('mode', value)}
                                                />
                                                <Field
                                                    label="Size"
                                                    type="number"
                                                    value={groupForm.data.group_size}
                                                    onChange={(value) => groupForm.setData('group_size', Number(value))}
                                                />
                                                <div className="space-y-2 md:col-span-2">
                                                    <Label>Court</Label>
                                                    <select
                                                        className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                                                        value={groupForm.data.court_id}
                                                        onChange={(event) => groupForm.setData('court_id', event.target.value)}
                                                    >
                                                        <option value="">No court assignment</option>
                                                        {activeSession.branch?.courts?.map((court: any) => (
                                                            <option key={court.id} value={court.id}>
                                                                {court.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <Button disabled={groupForm.processing || activeSession.queue.length === 0}>
                                                <UserCheck className="mr-2 size-4" />
                                                Call Group
                                            </Button>
                                        </form>

                                        <p className="text-sm font-semibold">Recommended Group</p>
                                        {activeRecommendation.map((entry) => (
                                            <div
                                                key={entry.id}
                                                className="rounded-lg border border-pink-200 bg-pink-50 p-3 text-sm text-pink-900 dark:bg-pink-400/10 dark:text-pink-100"
                                            >
                                                <p className="font-semibold">{entry.player?.name}</p>
                                                <p>Rating {entry.player?.rating}</p>
                                            </div>
                                        ))}
                                        {groupForm.data.mode === 'manual' && (
                                            <div className="rounded-lg border p-3">
                                                <p className="mb-2 text-sm font-semibold">Manual Selection</p>
                                                <div className="grid gap-2">
                                                    {activeSession.queue.map((entry: any) => (
                                                        <label key={entry.id} className="flex items-center gap-2 text-sm">
                                                            <input
                                                                type="checkbox"
                                                                checked={groupForm.data.player_ids.includes(entry.player_id)}
                                                                onChange={() => toggleManualPlayer(entry.player_id)}
                                                            />
                                                            <span>
                                                                {entry.player?.name} - {entry.player?.rating}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">Create an open play session to start queueing players.</p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Add Players</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-2">
                            {players.slice(0, 8).map((player) => (
                                <div key={player.id} className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <p className="font-semibold">{player.name}</p>
                                        <p className="text-muted-foreground text-sm">Rating {player.rating}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => join(player.id)} disabled={!activeSession}>
                                            <UserPlus className="size-4" />
                                        </Button>
                                        <Button type="button" size="sm" onClick={() => checkIn(player.id)} disabled={!activeSession}>
                                            In
                                        </Button>
                                    </div>
                                </div>
                            ))}
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
            <Input type={type} step={type === 'number' ? '0.01' : undefined} value={value} onChange={(event) => onChange(event.target.value)} />
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
