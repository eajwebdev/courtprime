import { ScanToJoin } from '@/components/scan-to-join';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { Ticket } from 'lucide-react';
import { useState, type FormEvent } from 'react';

/**
 * Getting into tonight's rotation.
 *
 * The player's half of open play, and the only one that belongs on a player's
 * screen. It goes nowhere near the board: it opens the join page, which shows
 * the session and asks them to confirm.
 *
 * This is not OpenPlayBoardEntry. That one takes the board — one device at a
 * time, exclusive, for whoever is running the session. The two used to sit on
 * the same screens looking alike, and a player typing their code into the wrong
 * one was told the board was open on another device, which is true and useless.
 *
 * A GET rather than a post, so the same URL the QR carries is the URL this
 * produces, and a player can be sent one in a message.
 */
export function OpenPlayJoinEntry({ className, autoFocus = false }: { className?: string; autoFocus?: boolean }) {
    const [code, setCode] = useState('');
    const [key, setKey] = useState('');
    const [going, setGoing] = useState(false);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        setGoing(true);
        router.get('/open-play/join', { code: code.trim(), key: key.trim() }, { onFinish: () => setGoing(false) });
    };

    return (
        <form onSubmit={submit} className={className}>
            <label htmlFor="join-code" className="text-label text-foreground font-medium">
                Joining a session?
            </label>
            <p className="text-meta text-muted mt-0.5">
                Scan the club's QR, or enter the session ID and key they gave you. You go in the queue as yourself, so your games count.
            </p>

            <ScanToJoin className="mt-3 w-full sm:w-auto" />

            <p className="text-meta text-muted mt-3">Or type the pair:</p>

            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_9rem_auto]">
                <div className="relative min-w-0">
                    <Ticket className="text-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden />
                    <input
                        id="join-code"
                        value={code}
                        onChange={(event) => setCode(event.target.value.toUpperCase())}
                        placeholder="Session ID"
                        autoCapitalize="characters"
                        autoComplete="off"
                        spellCheck={false}
                        autoFocus={autoFocus}
                        /* 16px so iOS does not zoom the page on focus. */
                        className="border-border bg-surface text-foreground placeholder:text-muted sm:text-label h-12 w-full rounded-xl border pr-3 pl-10 text-base tracking-[0.12em] uppercase"
                    />
                </div>

                <div className="min-w-0">
                    <label htmlFor="join-key" className="sr-only">
                        Session key
                    </label>
                    <input
                        id="join-key"
                        value={key}
                        onChange={(event) => setKey(event.target.value.toUpperCase())}
                        placeholder="Key"
                        autoCapitalize="characters"
                        autoComplete="off"
                        spellCheck={false}
                        className="border-border bg-surface text-foreground placeholder:text-muted sm:text-label h-12 w-full rounded-xl border px-3 text-center text-base tracking-[0.2em] uppercase"
                    />
                </div>

                <Button type="submit" size="touch" disabled={going || !code.trim() || !key.trim()} className="w-full sm:w-auto sm:px-6">
                    Join
                </Button>
            </div>
        </form>
    );
}
