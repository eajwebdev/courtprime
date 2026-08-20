import { DiscoveryPage } from '@/components/discovery/discovery-page';
import { OpenPlayJoinEntry } from '@/components/open-play-join-entry';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { currency, friendlyDate, time12h } from '@/lib/format';
import { type SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { CalendarClock, Loader2, MapPin, Ticket, Users } from 'lucide-react';

type Session = {
    name: string;
    code: string;
    status: string;
    session_date: string | null;
    start_time: string;
    end_time: string;
    format: string | null;
    entry_fee: string | number | null;
    max_players: number | null;
    players_count: number;
    courts_count: number;
    branch: string | null;
    organization: string | null;
    organization_slug: string | null;
};

/**
 * One tap into tonight's rotation.
 *
 * Where the club's QR lands. A player standing at the court has already decided
 * to play, so this page has one job and shows one button; everything else on it
 * is there to confirm they are joining the right session.
 *
 * There is nothing here that runs the session. Scoring, courts and settings
 * live on the board, which is a different screen reached a different way, and
 * keeping them apart is the point of this page existing.
 */
export default function OpenPlayJoin({
    code,
    sessionKey,
    session,
    error,
}: {
    code: string;
    sessionKey: string;
    session: Session | null;
    error: string | null;
}) {
    const { auth } = usePage<SharedData>().props;
    const signedIn = Boolean(auth?.user);

    return (
        <>
            <Head title={session ? `Join ${session.name} | CourtPrime` : 'Join open play | CourtPrime'} />

            <DiscoveryPage current="/find-open-play">
                {/* Short page, phone in hand at the court: the card sits in the
                    middle of the screen rather than clinging to the header with
                    the footer stranded halfway down. */}
                <div className="mx-auto flex w-full max-w-2xl flex-col justify-center px-4 py-8 sm:px-6 sm:py-12 lg:min-h-[68svh]">
                    {session ? (
                        <SessionCard session={session} code={code} sessionKey={sessionKey} signedIn={signedIn} />
                    ) : (
                        <NoSession error={error} />
                    )}
                </div>
            </DiscoveryPage>
        </>
    );
}

function SessionCard({ session, code, sessionKey, signedIn }: { session: Session; code: string; sessionKey: string; signedIn: boolean }) {
    const form = useForm({ code, key: sessionKey });
    const fee = Number(session.entry_fee ?? 0);
    const spots = session.max_players === null ? null : Math.max(0, session.max_players - session.players_count);

    const join = () => form.post('/me/open-play/join', { preserveScroll: true });

    return (
        <div>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-eyebrow text-primary uppercase">You are joining</p>
                    <h1 className="text-h1 text-foreground mt-1">{session.name}</h1>
                </div>
                <StatusBadge status={session.status} />
            </div>

            {/* Where and when, so somebody who scanned the wrong poster can tell
                before they are in the queue. */}
            <dl className="border-border mt-6 divide-y rounded-xl border">
                <Row icon={MapPin} label="Club">
                    {session.organization_slug ? (
                        <Link href={`/clubs/${session.organization_slug}`} className="text-primary font-medium hover:underline">
                            {session.organization}
                        </Link>
                    ) : (
                        session.organization
                    )}
                    {session.branch && <span className="text-muted"> · {session.branch}</span>}
                </Row>
                <Row icon={CalendarClock} label="When">
                    {friendlyDate(session.session_date)} · {time12h(session.start_time)}–{time12h(session.end_time)}
                </Row>
                <Row icon={Users} label="Players">
                    <span data-numeric>{session.players_count}</span> checked in
                    {spots !== null && (
                        <>
                            {' · '}
                            <span data-numeric className="font-medium">
                                {spots}
                            </span>{' '}
                            {spots === 1 ? 'spot' : 'spots'} left
                        </>
                    )}
                </Row>
                <Row icon={Ticket} label="Entry">
                    {fee > 0 ? currency(fee) : 'Free'}
                    <span className="text-muted"> · {session.format === 'singles' ? 'Singles' : 'Doubles'}</span>
                    <span className="text-muted">
                        {' · '}
                        <span data-numeric>{session.courts_count}</span> {session.courts_count === 1 ? 'court' : 'courts'}
                    </span>
                </Row>
            </dl>

            {signedIn ? (
                <>
                    <Button type="button" size="touch" onClick={join} disabled={form.processing} className="mt-6 w-full">
                        {form.processing ? <Loader2 className="size-4 animate-spin" /> : 'Join the rotation'}
                    </Button>
                    <p className="text-meta text-muted mt-3 text-center">
                        You go in the queue as yourself, so tonight's games land on your CourtPrime record.
                    </p>
                </>
            ) : (
                <>
                    {/*
                     * Signing in is not gatekeeping, it is the whole point:
                     * a game credited to nobody is a game that did not happen
                     * as far as anyone's record is concerned. The session is
                     * shown first so the ask is obviously about this session.
                     */}
                    <Button asChild size="touch" className="mt-6 w-full">
                        {/* The controller has already put this URL in the
                            session as the intended one, so login lands back
                            here with the session still on screen. */}
                        <Link href="/login">Sign in to join</Link>
                    </Button>
                    <p className="text-meta text-muted mt-3 text-center">
                        No account?{' '}
                        <Link href="/register" className="text-primary font-medium hover:underline">
                            Create one
                        </Link>{' '}
                        — it takes a minute and your record follows you to every connected club.
                    </p>
                </>
            )}

            {form.errors.code && (
                <p role="alert" className="text-meta text-danger mt-4 text-center">
                    {form.errors.code}
                </p>
            )}

            {/* The other job, named and sent elsewhere rather than sitting on
                this page as a second button somebody might read as "start". */}
            <p className="text-meta text-muted border-border mt-8 border-t pt-6 text-center">
                Running this session instead?{' '}
                <Link href="/open-play/board" className="text-foreground font-medium hover:underline">
                    Open the session board
                </Link>
            </p>
        </div>
    );
}

function NoSession({ error }: { error: string | null }) {
    return (
        <div>
            <p className="text-eyebrow text-primary uppercase">Open play</p>
            <h1 className="text-h1 text-foreground mt-1">Join a session</h1>
            <p className="text-body text-secondary mt-2">
                Point your phone's camera at the QR the club has up at the court, or enter the session ID and key they gave you.
            </p>

            {error && (
                <p role="alert" className="text-meta text-danger border-danger/30 bg-danger-soft mt-6 rounded-xl border px-4 py-3">
                    {error}
                </p>
            )}

            <OpenPlayJoinEntry className="border-border bg-surface mt-6 rounded-xl border p-4 sm:p-5" autoFocus />

            <p className="text-meta text-muted mt-6">
                Looking for what is on tonight?{' '}
                <Link href="/find-open-play" className="text-primary font-medium hover:underline">
                    Browse open play
                </Link>
            </p>
        </div>
    );
}

function Row({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 px-4 py-3">
            <Icon className="text-muted mt-0.5 size-4 shrink-0" aria-hidden />
            <dt className="text-label text-muted w-20 shrink-0">{label}</dt>
            <dd className="text-label text-foreground min-w-0 flex-1">{children}</dd>
        </div>
    );
}
