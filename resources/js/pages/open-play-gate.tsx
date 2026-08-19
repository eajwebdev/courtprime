import { DiscoveryPage } from '@/components/discovery/discovery-page';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { time12h } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';
import { KeyRound, Loader2, MapPin, TriangleAlert, Users } from 'lucide-react';
import { useRef, type FormEvent } from 'react';

type ActiveSession = {
    id: number;
    name: string;
    code: string;
    status: string;
    players_count: number;
    session_date: string;
    start_time: string;
    end_time: string;
    branch: string | null;
    organization: string | null;
};

/** A session the signed-in user already administers, openable without the pair. */
type StaffSession = {
    id: number;
    name: string;
    code: string;
    status: string;
    session_date: string;
    start_time: string;
    end_time: string;
    branch: string | null;
    held: boolean;
};

function dayLabel(iso: string) {
    if (!iso) return '';

    const value = new Date(`${iso}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diff = Math.round((value.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';

    return value.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * The way in to a session board.
 *
 * Two credentials, because the ID alone is on a screen at the club and runs in
 * an obvious sequence. Nothing about a session is revealed until both are
 * right: the list below shows what is running, which the discovery page already
 * makes public, but never a key and never whether a board is already held.
 */
export default function OpenPlayGate({ active = [], mine = [] }: { active?: ActiveSession[]; mine?: StaffSession[] }) {
    const form = useForm({ code: '', key: '', who: '' });
    const keyField = useRef<HTMLInputElement>(null);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/open-play/board', { preserveScroll: true });
    };

    /* Tapping a session fills the ID and puts the cursor where the only thing
       still missing goes. */
    const pick = (session: ActiveSession) => {
        form.setData('code', session.code);
        keyField.current?.focus();
    };

    return (
        <DiscoveryPage current="/find-open-play">
            <Head title="Open play board | CourtPrime" />

            <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-[24rem_minmax(0,1fr)] lg:gap-10">
                    <div>
                        <div className="bg-surface-deep text-surface-deep-foreground rounded-2xl px-5 py-5">
                            <p className="text-eyebrow text-primary uppercase">Open play</p>
                            <h1 className="mt-1 text-[1.5rem] leading-tight font-semibold tracking-tight text-white">Open your session board</h1>
                            <p className="text-meta mt-1.5 text-white/55">
                                {mine.length > 0
                                    ? 'Your club’s sessions open straight from here. The ID and key are for everyone else.'
                                    : 'Enter the session ID and key the club gave you.'}
                            </p>
                        </div>

                        {/* Signed in and running this club: no reason to type a
                            secret you are the one handing out. */}
                        {mine.length > 0 && (
                            <div className="border-border bg-surface mt-4 overflow-hidden rounded-xl border">
                                <p className="border-border bg-surface-muted text-label text-foreground border-b px-4 py-2.5 font-semibold">
                                    Your sessions
                                </p>
                                <ul className="divide-border divide-y">
                                    {mine.map((session) => (
                                        <li key={session.id} className="flex items-center gap-3 px-4 py-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-label text-foreground truncate font-medium">{session.name}</p>
                                                <p className="text-meta text-muted truncate">
                                                    {session.branch}
                                                    {session.branch && ' · '}
                                                    {dayLabel(session.session_date)}
                                                    {session.start_time && (
                                                        <>
                                                            {' · '}
                                                            <span data-numeric>{time12h(session.start_time)}</span>
                                                        </>
                                                    )}
                                                </p>
                                                {session.held && (
                                                    <p className="text-meta text-warning mt-0.5">
                                                        Another device is running it — you will open it read-only.
                                                    </p>
                                                )}
                                            </div>
                                            <StatusBadge status={session.status} />
                                            <Button asChild size="sm" className="shrink-0">
                                                <Link href={`/open-play/${session.code}/board`}>Open</Link>
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <form onSubmit={submit} className="border-border bg-surface mt-4 rounded-xl border p-4 sm:p-5">
                            <div className="grid gap-4">
                                <div className="relative">
                                    <label htmlFor="code" className="text-label text-foreground font-medium">
                                        Session ID
                                    </label>
                                    <KeyRound className="text-muted pointer-events-none absolute top-[2.4rem] left-3.5 size-4" aria-hidden />
                                    <input
                                        id="code"
                                        value={form.data.code}
                                        onChange={(event) => form.setData('code', event.target.value.toUpperCase())}
                                        placeholder="OP-00001"
                                        autoCapitalize="characters"
                                        autoComplete="off"
                                        spellCheck={false}
                                        className="border-border bg-surface text-foreground placeholder:text-muted mt-1.5 h-12 w-full rounded-xl border pr-3 pl-10 text-base tracking-[0.12em] uppercase"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="key" className="text-label text-foreground font-medium">
                                        Session key
                                    </label>
                                    <input
                                        id="key"
                                        ref={keyField}
                                        value={form.data.key}
                                        onChange={(event) => form.setData('key', event.target.value.toUpperCase())}
                                        placeholder="XXXXXX"
                                        autoCapitalize="characters"
                                        autoComplete="off"
                                        spellCheck={false}
                                        className="border-border bg-surface text-foreground placeholder:text-muted mt-1.5 h-12 w-full rounded-xl border px-3.5 text-center text-base tracking-[0.35em] uppercase"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="who" className="text-label text-foreground font-medium">
                                        Your name <span className="text-muted font-normal">(optional)</span>
                                    </label>
                                    {/* Only ever used to sign entries in the session
                                        history, so "who added that player" has an
                                        answer when the tablet gets passed around. */}
                                    <p className="text-meta text-muted mt-0.5">Shown against anything you change on the board.</p>
                                    <input
                                        id="who"
                                        value={form.data.who}
                                        onChange={(event) => form.setData('who', event.target.value)}
                                        placeholder="Who is on this device"
                                        autoComplete="name"
                                        className="border-border bg-surface text-foreground placeholder:text-muted mt-1.5 h-12 w-full rounded-xl border px-3.5 text-base"
                                    />
                                </div>
                            </div>

                            {form.errors.code && (
                                <p
                                    role="alert"
                                    className="border-danger/25 bg-danger-soft text-label text-danger mt-4 flex items-start gap-2 rounded-lg border px-3 py-2.5"
                                >
                                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                                    {form.errors.code}
                                </p>
                            )}

                            <Button
                                type="submit"
                                size="touch"
                                disabled={form.processing || !form.data.code.trim() || !form.data.key.trim()}
                                className="mt-4 w-full"
                            >
                                {form.processing ? <Loader2 className="size-4 animate-spin" /> : 'Open board'}
                            </Button>
                        </form>
                    </div>

                    <section className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
                            <h2 className="text-h2 text-foreground">Running now</h2>
                            <p className="text-meta text-muted">
                                <span data-numeric className="text-foreground font-semibold">
                                    {active.length}
                                </span>{' '}
                                {active.length === 1 ? 'session' : 'sessions'}
                            </p>
                        </div>

                        {active.length === 0 ? (
                            <div className="border-border rounded-xl border border-dashed px-5 py-12 text-center">
                                <p className="text-label text-foreground font-medium">Nothing open right now</p>
                                <p className="text-meta text-muted mx-auto mt-1 max-w-sm">
                                    A session appears here once a club opens one. You can still open a board with its ID and key.
                                </p>
                                <Button asChild variant="outline" className="mt-4">
                                    <Link href="/find-courts">Find a court</Link>
                                </Button>
                            </div>
                        ) : (
                            <ul className="divide-border border-border divide-y overflow-hidden rounded-xl border">
                                {active.map((session) => (
                                    <li key={session.id}>
                                        {/* Tapping fills the ID. The key still has to
                                            come from the club, which is the point. */}
                                        <button
                                            type="button"
                                            onClick={() => pick(session)}
                                            className={cn(
                                                'hover:bg-surface-muted flex w-full items-center gap-4 px-4 py-3 text-left transition-colors',
                                                form.data.code === session.code && 'bg-primary-soft',
                                            )}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="text-meta text-primary truncate font-semibold tracking-wide uppercase">
                                                    {session.organization}
                                                </p>
                                                <p className="text-label text-foreground mt-0.5 truncate font-medium">{session.name}</p>
                                                <p className="text-meta text-muted mt-0.5 flex items-center gap-1.5">
                                                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                                                    <span className="truncate">{session.branch}</span>
                                                </p>
                                                <p className="text-meta text-secondary mt-1">
                                                    <span data-numeric>
                                                        {dayLabel(session.session_date)} {time12h(session.start_time)}–{time12h(session.end_time)}
                                                    </span>
                                                    <span className="text-muted"> · </span>
                                                    <span className="text-muted inline-flex items-center gap-1">
                                                        <Users className="size-3.5" aria-hidden />
                                                        <span data-numeric>{session.players_count}</span>
                                                    </span>
                                                </p>
                                            </div>

                                            <div className="flex shrink-0 flex-col items-end gap-1.5">
                                                <StatusBadge status={session.status} />
                                                <span data-numeric className="text-meta text-muted tracking-[0.1em]">
                                                    {session.code}
                                                </span>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <p className="text-meta text-muted mt-3">Keys are never listed. The club hands them out at the desk.</p>
                    </section>
                </div>
            </div>
        </DiscoveryPage>
    );
}
