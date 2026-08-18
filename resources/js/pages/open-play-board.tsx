import { FlashToast } from '@/components/flash-toast';
import { BrandWordmarkAuto } from '@/components/marketing-artwork';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Head, router, useForm } from '@inertiajs/react';
import { Check, Copy, Loader2, Minus, Trophy, UserPlus, Users } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payload from PublicOpenPlayBoardController. */

type Props = { session: any; courts: any[]; liveMatches: any[]; waiting: any[]; results: any[] };

export default function OpenPlayBoard({ session, courts, liveMatches, waiting, results }: Props) {
    const [copied, setCopied] = useState(false);
    const base = `/open-play/${session.session_code}`;

    /*
     * Several phones and a tablet can all be looking at this at once, so the
     * board refetches rather than assuming it is the only thing changing the
     * score.
     */
    useEffect(() => {
        const timer = window.setInterval(() => {
            /* A partial reload: `reload` already preserves component state and
               scroll, so a refresh landing while someone is half way through
               typing a name leaves what they have typed alone. */
            router.reload({ only: ['liveMatches', 'waiting', 'results', 'session'] });
        }, 8000);

        return () => window.clearInterval(timer);
    }, []);

    const post = (url: string, data: Record<string, string> = {}) => router.post(url, data, { preserveScroll: true, preserveState: true });

    const copyCode = async () => {
        await navigator.clipboard?.writeText(session.session_code ?? '');
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    };

    const busy = liveMatches.map((match) => match.court);
    const idle = courts.filter((court) => !busy.includes(court.name));
    const needed = Math.max(0, 4 - waiting.length);

    return (
        /*
         * Deliberately not the staff shell. The people running this are the
         * players on the court, reached by the session code, so there is no
         * workspace sidebar and nothing to navigate away into.
         */
        <div className="bg-background text-foreground min-h-svh">
            <Head title={`${session.session_code} · ${session.name} | CourtPrime`} />

            <header className="border-border bg-background/95 z-nav sticky top-0 border-b backdrop-blur-md">
                <div className="mx-auto flex h-14 w-full max-w-[110rem] items-center justify-between gap-3 px-4">
                    <BrandWordmarkAuto height={28} className="h-7" />
                    <p className="text-meta text-muted truncate">
                        {session.name} · {session.branch}
                    </p>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-[110rem] flex-col gap-4 px-4 py-4">
                <section className="bg-surface-deep text-surface-deep-foreground flex flex-wrap items-center justify-between gap-4 rounded-2xl px-4 py-4 sm:px-6">
                    <div className="min-w-0">
                        <p className="text-eyebrow text-primary uppercase">Session code</p>
                        <p data-numeric className="text-[1.75rem] leading-none font-semibold tracking-tight text-white sm:text-[2.25rem]">
                            {session.session_code ?? '—'}
                        </p>
                        <p className="text-meta mt-1 truncate text-white/55">
                            round <span data-numeric>{session.current_round}</span> · anyone here can add players and keep score
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <dl className="flex gap-4">
                            <Stat label="On court" value={liveMatches.length * 4} />
                            <Stat label="Waiting" value={waiting.length} />
                            <Stat label="Courts" value={courts.length} />
                        </dl>
                        <Button type="button" variant="onDeep" size="touch" onClick={copyCode} className="shrink-0">
                            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                            {copied ? 'Copied' : 'Copy'}
                        </Button>
                    </div>
                </section>

                <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
                    {/* ---- Courts ------------------------------------------- */}
                    <div className="grid content-start gap-4 lg:grid-cols-2">
                        {liveMatches.map((match) => (
                            <CourtCard key={match.id} match={match} base={base} post={post} />
                        ))}

                        {idle.map((court) => (
                            <article
                                key={court.id}
                                className="border-border flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center"
                            >
                                <p className="text-label text-foreground font-semibold">{court.name}</p>
                                <p className="text-meta text-muted mt-1">
                                    {needed === 0 ? 'Assigning next match…' : `Idle · ${needed} more ${needed === 1 ? 'player' : 'players'} needed`}
                                </p>
                            </article>
                        ))}

                        {courts.length === 0 && (
                            <p className="border-border text-label text-muted col-span-full rounded-xl border border-dashed px-5 py-10 text-center">
                                No courts allocated to this session.
                            </p>
                        )}
                    </div>

                    {/* ---- Add, queue, standings ---------------------------- */}
                    <aside className="flex flex-col gap-4">
                        <AddPlayer base={base} />

                        <div className="border-border bg-surface overflow-hidden rounded-xl border">
                            <div className="border-border bg-surface-muted flex items-center justify-between gap-3 border-b px-4 py-2">
                                <p className="text-label text-foreground flex items-center gap-1.5 font-semibold">
                                    <Users className="size-4 shrink-0" aria-hidden />
                                    Up next
                                </p>
                                <p className="text-meta text-muted">
                                    <span data-numeric>{waiting.length}</span> waiting
                                </p>
                            </div>

                            {waiting.length === 0 ? (
                                <p className="text-meta text-muted px-4 py-8 text-center">Nobody waiting yet. Add whoever turns up.</p>
                            ) : (
                                <ul className="divide-border max-h-72 divide-y overflow-y-auto">
                                    {waiting.map((entry, index) => (
                                        <li key={entry.player_id} className="flex items-center gap-3 px-4 py-2.5">
                                            <span
                                                data-numeric
                                                className={cn(
                                                    'text-meta flex size-7 shrink-0 items-center justify-center rounded-full font-semibold',
                                                    needed === 0 && index < 4 ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-muted',
                                                )}
                                            >
                                                {index + 1}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-label text-foreground truncate font-medium">{entry.name}</p>
                                                <p className="text-meta text-muted">
                                                    <span data-numeric>{entry.games}</span> {entry.games === 1 ? 'game' : 'games'} ·{' '}
                                                    <span data-numeric>{entry.wins}</span> won
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {results.length > 0 && (
                            <div className="border-border bg-surface overflow-hidden rounded-xl border">
                                <div className="border-border bg-surface-muted flex items-center gap-1.5 border-b px-4 py-2">
                                    <Trophy className="text-primary size-4 shrink-0" aria-hidden />
                                    <p className="text-label text-foreground font-semibold">Standings</p>
                                </div>
                                <ul className="divide-border max-h-64 divide-y overflow-y-auto">
                                    {results.map((row) => (
                                        <li key={row.player_id} className="flex items-center justify-between gap-3 px-4 py-2">
                                            <p className="text-label text-foreground min-w-0 truncate">{row.name}</p>
                                            <p className="text-meta text-muted shrink-0">
                                                <span data-numeric className="text-foreground font-semibold">
                                                    {row.wins}
                                                </span>
                                                <span className="text-muted">/</span>
                                                <span data-numeric>{row.games}</span>
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </aside>
                </div>
            </main>

            <FlashToast />
        </div>
    );
}

/**
 * One court.
 *
 * Tapping a team adds their point. Finishing asks who won rather than assuming
 * the scoreboard is the whole story, so a game called on court is recorded the
 * same way as one played out to eleven.
 */
function CourtCard({ match, base, post }: { match: any; base: string; post: (url: string, data?: Record<string, string>) => void }) {
    const [confirming, setConfirming] = useState(false);

    const one = match.teams?.one ?? [];
    const two = match.teams?.two ?? [];
    const label = (players: any[]) => players.map((player: any) => player.name).join(' / ');

    return (
        <article className="border-border bg-surface overflow-hidden rounded-xl border">
            <div className="border-border bg-surface-muted flex items-center justify-between gap-3 border-b px-4 py-2">
                <p className="text-label text-foreground font-semibold">{match.court}</p>
                <p className="text-meta text-muted">
                    round <span data-numeric>{match.round}</span>
                </p>
            </div>

            <div className="bg-border grid grid-cols-2 gap-px">
                <TeamScore
                    players={one}
                    score={match.team_one_score}
                    onScore={() => post(`${base}/matches/${match.id}/score`, { team: 'team_one' })}
                />
                <TeamScore
                    players={two}
                    score={match.team_two_score}
                    onScore={() => post(`${base}/matches/${match.id}/score`, { team: 'team_two' })}
                />
            </div>

            {confirming ? (
                <div className="border-border border-t px-3 py-3">
                    <p className="text-meta text-muted mb-2 text-center">Who won?</p>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            size="touch"
                            data-winner="one"
                            className="min-w-0"
                            onClick={() => post(`${base}/matches/${match.id}/finish`, { winner: 'one' })}
                        >
                            <span className="truncate">{label(one)}</span>
                        </Button>
                        <Button
                            type="button"
                            size="touch"
                            data-winner="two"
                            className="min-w-0"
                            onClick={() => post(`${base}/matches/${match.id}/finish`, { winner: 'two' })}
                        >
                            <span className="truncate">{label(two)}</span>
                        </Button>
                    </div>
                    <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => setConfirming(false)}>
                        Cancel
                    </Button>
                </div>
            ) : (
                <div className="border-border flex gap-2 border-t px-3 py-3">
                    <Button
                        type="button"
                        variant="ghost"
                        size="iconTouch"
                        aria-label="Undo last point"
                        className="shrink-0"
                        onClick={() => post(`${base}/matches/${match.id}/undo`)}
                    >
                        <Minus className="size-4" />
                    </Button>
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirming(true)}>
                        <Trophy className="size-4" />
                        Finish match
                    </Button>
                </div>
            )}
        </article>
    );
}

function TeamScore({ players, score, onScore }: { players: any[]; score: number; onScore: () => void }) {
    return (
        <button
            type="button"
            onClick={onScore}
            /* The whole half scores: a small "+1" is a miss on a tablet at
               arm's length across a court. */
            className="bg-surface hover:bg-primary-soft active:bg-primary-soft flex min-h-36 flex-col items-center justify-center gap-1 px-3 py-4 transition-colors"
        >
            <span className="text-meta text-secondary line-clamp-2 text-center">{players.map((player: any) => player.name).join(' / ')}</span>
            <span data-numeric className="text-foreground text-[3rem] leading-none font-semibold">
                {score}
            </span>
            <span className="text-meta text-muted">tap to score</span>
        </button>
    );
}

function AddPlayer({ base }: { base: string }) {
    const form = useForm({ name: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(`${base}/players`, { preserveScroll: true, onSuccess: () => form.reset() });
    };

    return (
        <form onSubmit={submit} className="border-border bg-surface rounded-xl border p-4">
            <label htmlFor="add-player" className="text-label text-foreground font-medium">
                Add a player
            </label>
            <p className="text-meta text-muted mt-0.5">Anyone who turns up. No account needed.</p>

            <div className="mt-3 flex gap-2">
                <div className="relative min-w-0 flex-1">
                    <UserPlus className="text-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden />
                    <input
                        id="add-player"
                        value={form.data.name}
                        onChange={(event) => form.setData('name', event.target.value)}
                        placeholder="Player name"
                        autoComplete="off"
                        className="border-border bg-surface text-foreground placeholder:text-muted sm:text-label h-12 w-full rounded-xl border pr-3 pl-10 text-base"
                    />
                </div>
                <Button type="submit" size="touch" disabled={form.processing || form.data.name.trim().length < 2} className="shrink-0">
                    {form.processing ? <Loader2 className="size-4 animate-spin" /> : 'Add'}
                </Button>
            </div>

            {form.errors.name && (
                <p role="alert" className="text-meta text-danger mt-2">
                    {form.errors.name}
                </p>
            )}
        </form>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="text-center">
            <dt className="text-[0.6875rem] tracking-wide text-white/45 uppercase">{label}</dt>
            <dd data-numeric className="text-lg leading-none font-semibold text-white">
                {value}
            </dd>
        </div>
    );
}
