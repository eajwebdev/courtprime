import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { RadioTower, Trophy } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Matches', href: '/matches' }];

export default function Matches({ matches, courts }: { matches: any; courts: any[] }) {
    const form = useForm({
        court_id: courts[0]?.id ?? '',
        match_type: 'doubles',
        team_one_name: 'Santos / Cruz',
        team_two_name: 'Reyes / Lim',
        target_score: 11,
        win_by_two: true,
        scoring_mode: 'side_out',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/matches', { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Matches" />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[0.8fr_1.5fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Trophy className="size-4 text-pink-600" />
                            Start Match
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Court</Label>
                                <select
                                    className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                                    value={form.data.court_id}
                                    onChange={(event) => form.setData('court_id', Number(event.target.value))}
                                >
                                    {courts.map((court) => (
                                        <option key={court.id} value={court.id}>
                                            {court.branch?.code} - {court.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Field label="Team One" value={form.data.team_one_name} onChange={(value) => form.setData('team_one_name', value)} />
                            <Field label="Team Two" value={form.data.team_two_name} onChange={(value) => form.setData('team_two_name', value)} />
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Target</Label>
                                    <select
                                        className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                                        value={form.data.target_score}
                                        onChange={(event) => form.setData('target_score', Number(event.target.value))}
                                    >
                                        {[11, 15, 21].map((score) => (
                                            <option key={score} value={score}>
                                                First to {score}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Scoring</Label>
                                    <select
                                        className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                                        value={form.data.scoring_mode}
                                        onChange={(event) => form.setData('scoring_mode', event.target.value)}
                                    >
                                        <option value="side_out">Side Out</option>
                                        <option value="rally">Rally</option>
                                    </select>
                                </div>
                            </div>
                            <Button disabled={form.processing} className="w-full">
                                Start Live Match
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Match Center</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {matches.data.map((match: any) => (
                            <div key={match.id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold">
                                            {match.team_one_name} vs {match.team_two_name}
                                        </p>
                                        <StatusBadge status={match.status} />
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        {match.court?.branch?.name} - {match.court?.name} - Game {match.game_number}
                                    </p>
                                </div>
                                <div className="text-2xl font-black text-pink-600">
                                    {match.team_one_score} - {match.team_two_score}
                                </div>
                                <Link
                                    href={`/matches/${match.id}/scorekeeper`}
                                    className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium"
                                >
                                    <RadioTower className="size-4" />
                                    Score
                                </Link>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Input value={value} onChange={(event) => onChange(event.target.value)} />
        </div>
    );
}
