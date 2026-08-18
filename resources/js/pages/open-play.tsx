import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { currency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Check, Copy, MonitorPlay, RotateCw, Users } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payloads come from OpenPlayController. */

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Open Play', href: '/open-play' }];

type Props = {
    sessions: any;
    activeSession: any;
    sessionCourts: any[];
    liveMatches: any[];
    waiting: any[];
    branches: any[];
};

export default function OpenPlay({ sessions, activeSession, sessionCourts = [], liveMatches = [], waiting = [], branches }: Props) {
    const [copied, setCopied] = useState(false);

    const form = useForm({
        branch_id: branches[0]?.id ?? '',
        name: 'Saturday Social Open Play',
        session_code: '',
        court_ids: [] as number[],
        session_date: new Date().toISOString().slice(0, 10),
        start_time: '19:00',
        end_time: '22:00',
        entry_fee: 200,
    });

    /* Allocated courts with nothing on them. Leaving them off the board made
       an idle court look like a court that was never selected. */
    const busyCourts = liveMatches.map((match) => match.court);
    const idleCourts = sessionCourts.filter((court: any) => !busyCourts.includes(court.name));
    /* Four is a match. Below that nobody can be called, however long they wait. */
    const canCall = waiting.length >= 4 && idleCourts.length > 0;

    const branch = branches.find((entry) => entry.id === Number(form.data.branch_id)) ?? branches[0];
    const courts: any[] = branch?.courts ?? [];

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/open-play', { preserveScroll: true });
    };

    const toggleCourt = (courtId: number) => {
        const next = form.data.court_ids.includes(courtId) ? form.data.court_ids.filter((id) => id !== courtId) : [...form.data.court_ids, courtId];

        form.setData('court_ids', next);
    };

    const releaseCourt = (matchId: number) => {
        router.post(`/open-play/${activeSession.id}/matches/${matchId}/complete`, {}, { preserveScroll: true });
    };

    const copyCode = async () => {
        /* Both halves together: they are useless apart. */
        await navigator.clipboard?.writeText(`${activeSession.session_code ?? ''} · key ${activeSession.session_key ?? ''}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Open Play" />

            <div className="space-y-8 p-4 md:p-6">
                {activeSession && (
                    <>
                        {/*
                         * The code is the whole flow now. It is the largest thing
                         * on the page because a member of staff reads it out
                         * across a hall, and players type it themselves.
                         */}
                        <section className="bg-surface-deep text-surface-deep-foreground relative overflow-hidden rounded-2xl px-4 py-5 sm:px-7 sm:py-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-eyebrow text-primary uppercase">Share both with players</p>
                                    <div className="mt-1 flex flex-wrap items-baseline gap-x-5 gap-y-1">
                                        <p data-numeric className="text-[2rem] leading-none font-semibold tracking-tight text-white sm:text-[2.5rem]">
                                            {activeSession.session_code ?? '—'}
                                        </p>
                                        <p className="text-eyebrow text-white/45 uppercase">
                                            key{' '}
                                            <span data-numeric className="text-primary text-[1.5rem] leading-none font-semibold tracking-[0.15em]">
                                                {activeSession.session_key ?? '—'}
                                            </span>
                                        </p>
                                    </div>
                                    <p className="text-meta mt-2 truncate text-white/55">
                                        {activeSession.name} · {activeSession.branch?.name} · round{' '}
                                        <span data-numeric>{activeSession.current_round ?? 0}</span>
                                    </p>
                                </div>

                                <div className="flex shrink-0 gap-2">
                                    <Button type="button" variant="onDeep" size="touch" onClick={copyCode}>
                                        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                                        {copied ? 'Copied' : 'Copy ID + key'}
                                    </Button>
                                    {/* The screen you actually run the session from. */}
                                    <Button asChild size="touch">
                                        <Link href={`/open-play/${activeSession.session_code}/board`}>
                                            <MonitorPlay className="size-4" />
                                            Open board
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            <dl className="mt-5 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10">
                                <Metric label="Courts" value={sessionCourts.length} />
                                <Metric label="On court" value={liveMatches.length * 4} />
                                <Metric label="Waiting" value={waiting.length} />
                            </dl>
                        </section>

                        {/* ---- On court now -------------------------------------- */}
                        <section>
                            <h2 className="text-h2 text-foreground mb-3">On court now</h2>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {liveMatches.map((match) => (
                                    <article key={match.id} className="border-border bg-surface overflow-hidden rounded-xl border">
                                        <div className="border-border bg-surface-muted flex items-center justify-between gap-3 border-b px-4 py-2">
                                            <p className="text-label text-foreground font-semibold">{match.court}</p>
                                            <p className="text-meta text-muted">
                                                round <span data-numeric>{match.round}</span>
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4">
                                            <Team players={match.teams?.one ?? []} score={match.team_one_score} />
                                            <span className="text-meta text-muted">vs</span>
                                            <Team players={match.teams?.two ?? []} score={match.team_two_score} align="right" />
                                        </div>

                                        <div className="border-border border-t px-4 py-3">
                                            {/* Releasing the court is the only manual step left:
                                                the next match assigns itself. */}
                                            <Button type="button" variant="outline" className="w-full" onClick={() => releaseCourt(match.id)}>
                                                <RotateCw className="size-4" />
                                                Finish match, rotate next
                                            </Button>
                                        </div>
                                    </article>
                                ))}

                                {/* Idle allocated courts, so the owner can see the session
                                    has room and exactly why it is not being used. */}
                                {idleCourts.map((court: any) => (
                                    <article key={court.id} className="border-border rounded-xl border border-dashed px-4 py-8 text-center">
                                        <p className="text-label text-foreground font-semibold">{court.name}</p>
                                        <p className="text-meta text-muted mt-1">
                                            {waiting.length >= 4
                                                ? 'Assigning next match…'
                                                : `Idle · ${4 - waiting.length} more ${4 - waiting.length === 1 ? 'player' : 'players'} needed`}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        </section>

                        {/* ---- Waiting -------------------------------------------- */}
                        <section>
                            <div className="mb-3 flex items-baseline justify-between gap-3">
                                <h2 className="text-h2 text-foreground">Up next</h2>
                                <p className="text-meta text-muted">In the order the rotation will call them</p>
                            </div>

                            {waiting.length === 0 ? (
                                <p className="border-border text-label text-muted rounded-xl border border-dashed px-5 py-8 text-center">
                                    Nobody waiting. Players join with ID {activeSession.session_code} and its key.
                                </p>
                            ) : (
                                <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-xl border">
                                    {waiting.map((entry, index) => (
                                        <li key={entry.player_id} className="flex items-center gap-3 px-4 py-3">
                                            <span
                                                data-numeric
                                                className={cn(
                                                    'text-meta flex size-7 shrink-0 items-center justify-center rounded-full font-semibold',
                                                    canCall && index < 4 ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-muted',
                                                )}
                                            >
                                                {index + 1}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-label text-foreground truncate font-medium">{entry.name}</p>
                                                <p className="text-meta text-muted">
                                                    <span data-numeric>{entry.games}</span> {entry.games === 1 ? 'game' : 'games'}
                                                    {entry.rating > 0 && (
                                                        <>
                                                            {' · '}
                                                            <span data-numeric>{Number(entry.rating).toFixed(2)}</span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                            {canCall && index < 4 && <span className="text-meta text-primary shrink-0 font-medium">next up</span>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </>
                )}

                {/* ---- Create --------------------------------------------------- */}
                <section>
                    <h2 className="text-h2 text-foreground mb-1">Start a session</h2>
                    <p className="text-meta text-muted mb-4">Pick the courts and share the code. The system handles who plays whom.</p>

                    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-2">
                        <div className="space-y-4">
                            <Field label="Session name" value={form.data.name} error={form.errors.name} onChange={(v) => form.setData('name', v)} />

                            <div className="grid gap-2">
                                <Label htmlFor="branch">Branch</Label>
                                <select
                                    id="branch"
                                    className="border-input bg-surface text-label h-10 w-full rounded-md border px-3"
                                    value={form.data.branch_id}
                                    onChange={(event) => {
                                        form.setData('branch_id', Number(event.target.value));
                                        form.setData('court_ids', []);
                                    }}
                                >
                                    {branches.map((entry) => (
                                        <option key={entry.id} value={entry.id}>
                                            {entry.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <Field
                                    label="Date"
                                    type="date"
                                    value={form.data.session_date}
                                    error={form.errors.session_date}
                                    onChange={(v) => form.setData('session_date', v)}
                                />
                                <Field
                                    label="Start"
                                    type="time"
                                    value={form.data.start_time}
                                    error={form.errors.start_time}
                                    onChange={(v) => form.setData('start_time', v)}
                                />
                                <Field
                                    label="End"
                                    type="time"
                                    value={form.data.end_time}
                                    error={form.errors.end_time}
                                    onChange={(v) => form.setData('end_time', v)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Field
                                    label="Entry fee"
                                    type="number"
                                    value={form.data.entry_fee}
                                    error={form.errors.entry_fee}
                                    onChange={(v) => form.setData('entry_fee', Number(v))}
                                />
                                <Field
                                    label="Code"
                                    optional
                                    placeholder="Auto"
                                    value={form.data.session_code}
                                    error={form.errors.session_code}
                                    onChange={(v) => form.setData('session_code', v.toUpperCase())}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label>
                                    Courts for this session
                                    <span className="text-muted ml-1 font-normal">— only these are used</span>
                                </Label>

                                {courts.length === 0 ? (
                                    <p className="text-meta text-muted border-border mt-2.5 rounded-lg border border-dashed px-4 py-6 text-center">
                                        This branch has no courts yet.
                                    </p>
                                ) : (
                                    <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                        {courts.map((court: any) => {
                                            const selected = form.data.court_ids.includes(court.id);
                                            return (
                                                <button
                                                    key={court.id}
                                                    type="button"
                                                    aria-pressed={selected}
                                                    onClick={() => toggleCourt(court.id)}
                                                    className={cn(
                                                        'text-label flex min-h-11 items-center justify-center rounded-lg border px-2 text-center leading-tight font-medium transition-colors',
                                                        selected
                                                            ? 'border-primary bg-primary text-primary-foreground'
                                                            : 'border-border bg-surface text-secondary hover:border-border-strong hover:text-foreground',
                                                    )}
                                                >
                                                    {court.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {form.errors.court_ids && <p className="text-meta text-danger mt-2">{form.errors.court_ids}</p>}
                            </div>

                            <Button disabled={form.processing || form.data.court_ids.length === 0} size="touch" className="w-full">
                                <Users className="size-4" />
                                Create session
                            </Button>
                            {form.data.court_ids.length === 0 && <p className="text-meta text-muted text-center">Select at least one court.</p>}
                        </div>
                    </form>
                </section>

                {/* ---- History --------------------------------------------------- */}
                <section>
                    <h2 className="text-h2 text-foreground mb-3">Sessions</h2>
                    <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-xl border">
                        {sessions.data.map((session: any) => (
                            <li key={session.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                <div className="min-w-0">
                                    <p className="text-label text-foreground truncate font-medium">
                                        {session.name}
                                        {session.session_code && (
                                            <span data-numeric className="text-primary ml-2 font-semibold">
                                                {session.session_code}
                                                {session.session_key && <span className="text-muted"> · {session.session_key}</span>}
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-meta text-muted truncate">
                                        {session.branch?.name} · <span data-numeric>{session.players_count}</span> joined ·{' '}
                                        {currency(session.entry_fee)}
                                    </p>
                                </div>
                                <StatusBadge status={session.status} />
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </AppLayout>
    );
}

function Team({ players, score, align = 'left' }: { players: any[]; score: number; align?: 'left' | 'right' }) {
    return (
        <div className={cn('min-w-0', align === 'right' && 'text-right')}>
            {players.map((player) => (
                <p key={player.id} className="text-label text-foreground truncate font-medium">
                    {player.name}
                </p>
            ))}
            <p data-numeric className="text-h2 text-foreground mt-1">
                {score}
            </p>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="bg-surface-deep px-3 py-2.5">
            <dt className="truncate text-[0.6875rem] tracking-wide text-white/45 uppercase">{label}</dt>
            <dd data-numeric className="mt-0.5 text-lg leading-none font-semibold text-white">
                {value}
            </dd>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    type = 'text',
    error,
    optional,
    placeholder,
}: {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    type?: string;
    error?: string;
    optional?: boolean;
    placeholder?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label>
                {label}
                {optional && <span className="text-muted ml-1 font-normal">(optional)</span>}
            </Label>
            <Input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
            {error && <p className="text-meta text-danger">{error}</p>}
        </div>
    );
}
