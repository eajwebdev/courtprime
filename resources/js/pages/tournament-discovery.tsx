import { DateRail } from '@/components/booking/date-rail';
import { DiscoveryHero } from '@/components/discovery/discovery-chrome';
import { DiscoveryPage } from '@/components/discovery/discovery-page';
import { EmptyState } from '@/components/empty-state';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { currency } from '@/lib/format';
import { revealProps } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Head, router, useForm } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, Check, MapPin, Search, Trophy, Users, X } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payload from the tournament controller. */
type Props = { search: string; date?: string; tournaments: any };

export default function TournamentDiscovery({ search, date, tournaments }: Props) {
    const reduce = useReducedMotion();
    const [filters, setFilters] = useState({ search, date: date ?? '' });
    const [registering, setRegistering] = useState<any | null>(null);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.get('/find-tournaments', filters, { preserveState: true, preserveScroll: true });
    };

    const apply = (next: Partial<typeof filters>) => {
        const merged = { ...filters, ...next };
        setFilters(merged);
        router.get('/find-tournaments', merged, { preserveState: true, preserveScroll: true });
    };

    /* Search runs as you type, as it does on /find-courts and /me/book. */
    useEffect(() => {
        if (filters.search === search) return;

        const timer = setTimeout(() => {
            router.get('/find-tournaments', filters, { preserveState: true, preserveScroll: true, replace: true });
        }, 400);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.search, filters.date, search]);

    const rows: any[] = tournaments?.data ?? [];

    return (
        <>
            <Head title="Find tournaments | CourtPrime">
                <meta
                    name="description"
                    content="Discover public pickleball tournaments across connected CourtPrime clubs and register with one identity."
                />
            </Head>

            <DiscoveryPage current="/find-tournaments">
                <DiscoveryHero
                    eyebrow="CourtPrime competition network"
                    title="Register once. Compete anywhere."
                    description="Public tournaments across connected venues, with every result tied to one global player identity."
                    artwork="/cp-model1.png"
                >
                    {/* Same field and rail as /find-courts, /find-open-play and
                        /me/book. This page kept a bare <input type="date"> and a
                        Search button: the date picker was the browser's own grey
                        dd/mm/yyyy control sitting in the middle of the hero, and
                        the button asked for a second action the other three pages
                        stopped needing once search ran as you type. */}
                    <form onSubmit={submit} className="relative mt-5 sm:mt-7 sm:max-w-xl">
                        <label htmlFor="q" className="sr-only">
                            Tournament, club or city
                        </label>
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/70" aria-hidden />
                        <input
                            id="q"
                            type="search"
                            value={filters.search}
                            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                            placeholder="Tournament, club or city"
                            /* 16px on phones: anything smaller makes iOS zoom. */
                            className="sm:text-label h-12 w-full rounded-xl border border-white/15 bg-white/8 pr-12 pl-10 text-base text-white backdrop-blur-md placeholder:text-white/45 [&::-webkit-search-cancel-button]:hidden"
                        />
                        {filters.search && (
                            <button
                                type="button"
                                onClick={() => apply({ search: '' })}
                                aria-label="Clear search"
                                className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-white/60 hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                        <button type="submit" className="sr-only">
                            Search
                        </button>
                    </form>

                    {/*
                     * No `from`: a tournament can be running today, unlike a court
                     * booking, so today stays selectable. `clearable`, because the
                     * date is one optional filter here rather than the subject of
                     * the page — pressing the chosen day again goes back to every
                     * upcoming tournament, which the old date input could do and a
                     * rail otherwise could not.
                     */}
                    <DateRail value={filters.date} onChange={(next) => apply({ date: next })} tone="deep" clearable className="mt-3" />
                </DiscoveryHero>

                <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
                    <h2 className="text-h2 text-foreground">
                        <span data-numeric>{rows.length}</span> {rows.length === 1 ? 'tournament' : 'tournaments'}
                    </h2>

                    {rows.length === 0 ? (
                        <EmptyState
                            className="mt-6"
                            title="No tournaments match this search"
                            description="Try a later date or clear the search."
                            artwork="/cp-paddle4.png"
                        />
                    ) : (
                        <div className="mt-5 space-y-4">
                            {rows.map((tournament, index) => (
                                <motion.article
                                    key={tournament.id}
                                    {...revealProps(reduce, { delay: Math.min(index, 6) * 0.05, y: 14 })}
                                    className="border-border bg-surface overflow-hidden rounded-xl border"
                                >
                                    <div className="border-border flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-start sm:p-5">
                                        <span className="bg-primary-soft text-primary flex size-11 shrink-0 items-center justify-center rounded-lg">
                                            <Trophy className="size-5" />
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-h3 text-foreground">{tournament.name}</h3>
                                                <StatusBadge status={tournament.status} />
                                            </div>
                                            <p className="text-meta text-muted mt-1 flex items-center gap-1.5">
                                                <MapPin className="size-3.5 shrink-0" aria-hidden />
                                                <span className="truncate">
                                                    {tournament.branch.organization} · {tournament.branch.name}
                                                </span>
                                            </p>
                                            <p className="text-meta text-muted mt-0.5 flex items-center gap-1.5">
                                                <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                                                {tournament.starts_on}
                                                {tournament.ends_on && tournament.ends_on !== tournament.starts_on ? ` to ${tournament.ends_on}` : ''}
                                            </p>
                                        </div>

                                        <Button
                                            size="touch"
                                            disabled={!tournament.registration_open}
                                            onClick={() => setRegistering(tournament)}
                                            className="w-full sm:w-auto"
                                        >
                                            {tournament.registration_open ? 'Register' : 'Closed'}
                                        </Button>
                                    </div>

                                    <dl className="bg-border grid grid-cols-2 gap-px sm:grid-cols-3">
                                        <Fact label="Format" value={String(tournament.format ?? '').replaceAll('_', ' ')} />
                                        <Fact label="Entry" value={currency(tournament.entry_fee)} />
                                        <Fact
                                            label="Players"
                                            value={`${tournament.registrations_count}${tournament.max_players ? ` / ${tournament.max_players}` : ''}`}
                                        />
                                    </dl>

                                    {tournament.divisions.length > 0 && (
                                        <ul className="divide-border divide-y">
                                            {tournament.divisions.map((division: any) => (
                                                <li key={division.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                                                    <div className="min-w-0">
                                                        <p className="text-label text-foreground truncate font-medium">{division.name}</p>
                                                        <p className="text-meta text-muted truncate capitalize">
                                                            {String(division.match_type ?? '').replaceAll('_', ' ')} · {division.gender_policy}
                                                            {division.skill_level ? ` · ${division.skill_level}` : ''}
                                                        </p>
                                                    </div>
                                                    <span className="text-meta text-secondary bg-surface-muted flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-medium">
                                                        <Users className="size-3" aria-hidden />
                                                        <span data-numeric>
                                                            {division.registrations_count}
                                                            {division.max_teams ? ` / ${division.max_teams}` : ''}
                                                        </span>
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </motion.article>
                            ))}
                        </div>
                    )}
                </section>
            </DiscoveryPage>

            {/* Registration moves into a sheet so the list stays scannable and the
                form gets a full, focused surface on a phone. */}
            <Sheet open={Boolean(registering)} onOpenChange={(open) => !open && setRegistering(null)}>
                <SheetContent side="bottom" className="bg-surface h-[90svh] rounded-t-2xl p-0 sm:h-[85svh]">
                    <SheetTitle className="sr-only">Tournament registration</SheetTitle>
                    {registering && <RegistrationForm tournament={registering} onDone={() => setRegistering(null)} />}
                </SheetContent>
            </Sheet>
        </>
    );
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="bg-surface px-4 py-3">
            <dt className="text-muted text-[0.6875rem] tracking-wider uppercase">{label}</dt>
            <dd data-numeric className="text-label text-foreground mt-0.5 truncate font-semibold capitalize">
                {value}
            </dd>
        </div>
    );
}

function RegistrationForm({ tournament, onDone }: { tournament: any; onDone: () => void }) {
    const form = useForm({
        tournament_division_id: tournament.divisions[0]?.id ?? '',
        player_name: '',
        player_email: '',
        player_mobile_number: '',
        skill_level: '',
        partner_name: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(`/find-tournaments/${tournament.id}/register`, {
            preserveScroll: true,
            onSuccess: () => form.reset('player_name', 'player_email', 'player_mobile_number', 'skill_level', 'partner_name'),
        });
    };

    return (
        <form onSubmit={submit} className="flex h-full flex-col">
            <div className="border-border flex items-start justify-between gap-3 border-b px-5 py-4">
                <div className="min-w-0">
                    <h2 className="text-h3 text-foreground truncate">{tournament.name}</h2>
                    <p className="text-meta text-muted truncate">We match by email so you keep one CourtPrime identity.</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={onDone}>
                    Close
                </Button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                {form.recentlySuccessful && (
                    <p className="border-success/25 bg-success-soft text-label text-success flex items-center gap-2 rounded-lg border px-3 py-2 font-medium">
                        <Check className="size-4 shrink-0" /> Registration submitted.
                    </p>
                )}

                <Field
                    label="Player name"
                    value={form.data.player_name}
                    onChange={(v) => form.setData('player_name', v)}
                    error={form.errors.player_name}
                    required
                />
                <Field
                    label="Email"
                    type="email"
                    value={form.data.player_email}
                    onChange={(v) => form.setData('player_email', v)}
                    error={form.errors.player_email}
                    required
                />
                <Field
                    label="Mobile"
                    value={form.data.player_mobile_number}
                    onChange={(v) => form.setData('player_mobile_number', v)}
                    error={form.errors.player_mobile_number}
                />

                <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                        label="Skill"
                        value={form.data.skill_level}
                        onChange={(v) => form.setData('skill_level', v)}
                        error={form.errors.skill_level}
                    />
                    <Field
                        label="Partner"
                        value={form.data.partner_name}
                        onChange={(v) => form.setData('partner_name', v)}
                        error={form.errors.partner_name}
                    />
                </div>

                {/* Divisions as tiles, not a select: usually 2-4 options. */}
                <div>
                    <Label>Division</Label>
                    <div className="mt-2.5 grid gap-2">
                        {tournament.divisions.map((division: any) => {
                            const selected = form.data.tournament_division_id === division.id;
                            return (
                                <button
                                    key={division.id}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => form.setData('tournament_division_id', division.id)}
                                    className={cn(
                                        'flex min-h-14 items-center justify-between gap-3 rounded-lg border px-4 text-left transition-colors',
                                        selected ? 'border-primary bg-primary-soft' : 'border-border bg-surface hover:border-border-strong',
                                    )}
                                >
                                    <span className="min-w-0">
                                        <span className="text-label text-foreground block truncate font-medium">{division.name}</span>
                                        <span className="text-meta text-muted block truncate capitalize">
                                            {String(division.match_type ?? '').replaceAll('_', ' ')}
                                        </span>
                                    </span>
                                    {selected && (
                                        <span className="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded-full">
                                            <Check className="size-3" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {form.errors.tournament_division_id && <p className="text-meta text-danger mt-2">{form.errors.tournament_division_id}</p>}
                </div>
            </div>

            <div className="border-border bg-surface-muted border-t px-5 py-4">
                <Button type="submit" size="touch" disabled={form.processing || tournament.divisions.length === 0} className="w-full">
                    {form.processing ? 'Submitting' : 'Submit registration'}
                </Button>
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
    required,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    type?: string;
    required?: boolean;
}) {
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>
                {label}
                {!required && <span className="text-muted ml-1 font-normal">(optional)</span>}
            </Label>
            <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error) || undefined} />
            {error && <p className="text-meta text-danger">{error}</p>}
        </div>
    );
}
