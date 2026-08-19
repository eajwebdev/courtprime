import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { currency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ExternalLink, GitBranch, RotateCcw, Trophy, Users } from 'lucide-react';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Tournaments', href: '/tournaments' }];

export default function Tournaments({ tournaments, branches }: { tournaments: any; branches: any[] }) {
    const form = useForm({
        branch_id: branches[0]?.id ?? '',
        name: '',
        starts_on: new Date().toISOString().slice(0, 10),
        ends_on: '',
        registration_opens_at: '',
        registration_closes_at: '',
        format: 'round_robin',
        visibility: 'public',
        max_players: 64,
        entry_fee: 0,
        status: 'draft',
        division_name: 'Open Doubles',
        division_skill_level: '',
        division_match_type: 'doubles',
        division_gender_policy: 'open',
        division_max_teams: 16,
        notes: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/tournaments', { preserveScroll: true, onSuccess: () => form.reset('name', 'notes') });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tournaments" />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[0.9fr_1.6fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Trophy className="size-4 text-pink-600" />
                            New Tournament
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <Field label="Name" value={form.data.name} onChange={(value) => form.setData('name', value)} error={form.errors.name} />
                            <div className="space-y-2">
                                <Label>Branch</Label>
                                <select
                                    className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                                    value={form.data.branch_id}
                                    onChange={(event) => form.setData('branch_id', Number(event.target.value))}
                                >
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.code} - {branch.name}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.branch_id && <p className="text-xs text-red-600">{form.errors.branch_id}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Field
                                    label="Starts"
                                    type="date"
                                    value={form.data.starts_on}
                                    onChange={(value) => form.setData('starts_on', value)}
                                    error={form.errors.starts_on}
                                />
                                <Field
                                    label="Ends"
                                    type="date"
                                    value={form.data.ends_on}
                                    onChange={(value) => form.setData('ends_on', value)}
                                    error={form.errors.ends_on}
                                />
                                <Field
                                    label="Max Players"
                                    type="number"
                                    value={form.data.max_players}
                                    onChange={(value) => form.setData('max_players', Number(value))}
                                    error={form.errors.max_players}
                                />
                                <Field
                                    label="Entry Fee"
                                    type="number"
                                    value={form.data.entry_fee}
                                    onChange={(value) => form.setData('entry_fee', Number(value))}
                                    error={form.errors.entry_fee}
                                />
                                <Field
                                    label="Registration Opens"
                                    type="datetime-local"
                                    value={form.data.registration_opens_at}
                                    onChange={(value) => form.setData('registration_opens_at', value)}
                                    error={form.errors.registration_opens_at}
                                />
                                <Field
                                    label="Registration Closes"
                                    type="datetime-local"
                                    value={form.data.registration_closes_at}
                                    onChange={(value) => form.setData('registration_closes_at', value)}
                                    error={form.errors.registration_closes_at}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Select
                                    label="Format"
                                    value={form.data.format}
                                    options={['round_robin', 'single_elimination', 'double_elimination', 'ladder']}
                                    onChange={(value) => form.setData('format', value)}
                                />
                                <Select
                                    label="Status"
                                    value={form.data.status}
                                    options={['draft', 'published', 'registration_open', 'live', 'completed', 'cancelled']}
                                    onChange={(value) => form.setData('status', value)}
                                />
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-sm font-semibold">Opening Division</p>
                                <div className="mt-3 grid grid-cols-2 gap-3">
                                    <Field
                                        label="Division"
                                        value={form.data.division_name}
                                        onChange={(value) => form.setData('division_name', value)}
                                        error={form.errors.division_name}
                                    />
                                    <Field
                                        label="Skill"
                                        value={form.data.division_skill_level}
                                        onChange={(value) => form.setData('division_skill_level', value)}
                                        error={form.errors.division_skill_level}
                                    />
                                    <Select
                                        label="Match"
                                        value={form.data.division_match_type}
                                        options={['singles', 'doubles', 'mixed_doubles']}
                                        onChange={(value) => form.setData('division_match_type', value)}
                                    />
                                    <Field
                                        label="Max Teams"
                                        type="number"
                                        value={form.data.division_max_teams}
                                        onChange={(value) => form.setData('division_max_teams', Number(value))}
                                        error={form.errors.division_max_teams}
                                    />
                                </div>
                            </div>
                            <Button disabled={form.processing || branches.length === 0} className="w-full">
                                Create Tournament
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between gap-3 text-base">
                            <span>Tournament Command Center</span>
                            <Button asChild size="sm" variant="outline">
                                <Link href="/find-tournaments">
                                    <ExternalLink className="mr-2 size-4" />
                                    Public Discovery
                                </Link>
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {tournaments.data.map((tournament: any) => (
                            <div key={tournament.id} className="rounded-lg border p-4">
                                <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-semibold">{tournament.name}</p>
                                            <StatusBadge status={tournament.status} />
                                        </div>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            {tournament.branch?.name} - {tournament.starts_on} - {tournament.divisions.length} divisions
                                        </p>
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-semibold">{tournament.registrations_count} registrations</p>
                                        <p className="text-muted-foreground">{currency(tournament.entry_fee)}</p>
                                    </div>
                                    <StatusBadge status={tournament.visibility} />
                                </div>

                                <div className="mt-4 grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold">Divisions</p>
                                        {tournament.divisions.map((division: any) => (
                                            <div key={division.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                                                <div>
                                                    <p className="font-medium">{division.name}</p>
                                                    <p className="text-muted-foreground capitalize">
                                                        {division.match_type?.replaceAll('_', ' ')}{' '}
                                                        {division.skill_level ? `- ${division.skill_level}` : ''}
                                                    </p>
                                                </div>
                                                <span className="bg-surface-muted inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs">
                                                    <Users className="size-3" />
                                                    {division.registrations_count}
                                                    {division.max_teams ? ` / ${division.max_teams}` : ''}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold">Recent Registrations</p>
                                        {tournament.registrations.map((registration: any) => (
                                            <div
                                                key={registration.id}
                                                className="grid gap-2 rounded-lg border p-3 text-sm md:grid-cols-[1fr_auto_auto] md:items-center"
                                            >
                                                <div>
                                                    <p className="font-medium">{registration.player_name}</p>
                                                    <p className="text-muted-foreground">
                                                        {registration.player_profile?.courtprime_player_id ?? 'Unlinked'} -{' '}
                                                        {registration.division?.name}
                                                    </p>
                                                </div>
                                                <StatusBadge status={registration.payment_status} />
                                                <StatusBadge status={registration.status} />
                                            </div>
                                        ))}
                                        {tournament.registrations.length === 0 && (
                                            <div className="text-muted-foreground rounded-lg border p-3 text-sm">No registrations yet.</div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3">
                                    <p className="flex items-center gap-2 text-sm font-semibold">
                                        <GitBranch className="size-4 text-pink-600" />
                                        Brackets
                                    </p>
                                    {tournament.divisions.map((division: any) => (
                                        <BracketPanel key={division.id} tournament={tournament} division={division} />
                                    ))}
                                </div>
                            </div>
                        ))}
                        {tournaments.data.length === 0 && (
                            <div className="text-muted-foreground rounded-lg border p-4 text-sm">
                                No tournaments yet. Create the first CourtPrime tournament to start accepting registrations.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function BracketPanel({ tournament, division }: { tournament: any; division: any }) {
    const bracketForm = useForm({
        tournament_division_id: division.id,
        overwrite: false,
    });

    const generate = (overwrite = false) => {
        bracketForm.transform(() => ({ tournament_division_id: division.id, overwrite }));
        bracketForm.post(`/tournaments/${tournament.id}/brackets`, { preserveScroll: true });
    };

    return (
        <div className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-medium">{division.name}</p>
                    <p className="text-muted-foreground text-xs">
                        {division.bracket_matches_count} bracket matches from {division.registrations_count} registered teams
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={bracketForm.processing || division.registrations_count < 2}
                        onClick={() => generate(false)}
                    >
                        <GitBranch className="mr-2 size-4" />
                        Generate
                    </Button>
                    {division.bracket_matches_count > 0 && (
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={bracketForm.processing || division.registrations_count < 2}
                            onClick={() => generate(true)}
                        >
                            <RotateCcw className="mr-2 size-4" />
                            Regenerate
                        </Button>
                    )}
                </div>
            </div>

            {bracketForm.errors.overwrite && <p className="mt-2 text-xs text-red-600">{bracketForm.errors.overwrite}</p>}
            {bracketForm.errors.tournament_division_id && <p className="mt-2 text-xs text-red-600">{bracketForm.errors.tournament_division_id}</p>}

            <div className="mt-3 grid gap-2 lg:grid-cols-2">
                {division.bracket_matches.map((match: any) => (
                    <div key={match.id} className="bg-surface-muted/40 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                            <p className="font-medium">
                                Round {match.round_number} Match {match.match_number}
                            </p>
                            <StatusBadge status={match.status} />
                        </div>
                        <div className="mt-2 space-y-1">
                            <BracketTeam registration={match.team_one} winner={match.winner?.id === match.team_one?.id} />
                            <BracketTeam registration={match.team_two} winner={match.winner?.id === match.team_two?.id} />
                        </div>
                    </div>
                ))}
                {division.bracket_matches.length === 0 && (
                    <p className="bg-surface-muted/40 text-muted-foreground rounded-lg p-3 text-sm">
                        Generate the first bracket once at least two teams are registered.
                    </p>
                )}
            </div>
        </div>
    );
}

function BracketTeam({ registration, winner }: { registration?: any; winner?: boolean }) {
    if (!registration) {
        return <div className="text-muted-foreground rounded-md border border-dashed px-3 py-2">TBD</div>;
    }

    return (
        <div className="bg-background flex items-center justify-between gap-3 rounded-md border px-3 py-2">
            <span>
                {registration.seed ? `#${registration.seed} ` : ''}
                {registration.player_name}
                {registration.partner_name ? ` / ${registration.partner_name}` : ''}
            </span>
            {winner && <StatusBadge status="advance" />}
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
