import { Button } from '@/components/ui/button';
import { useForm } from '@inertiajs/react';
import { KeyRound, Loader2 } from 'lucide-react';
import { type FormEvent } from 'react';

/**
 * Taking an open play board with the ID and key.
 *
 * This is not a way to join a game. The pair opens the board and puts this
 * device in charge of it: whoever holds it adds the players, so entering it
 * does not put you in the rotation. One device holds a board at a time, and the
 * server refuses the pair while somebody else has it.
 *
 * No name is asked for, because nothing here is about you.
 */
export function OpenPlayBoardEntry({ className }: { className?: string }) {
    const form = useForm({ code: '', key: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/open-play/open', { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className={className}>
            <label htmlFor="board-code" className="text-label text-foreground font-medium">
                Running the session?
            </label>
            <p className="text-meta text-muted mt-0.5">Enter the session ID and key to open its board and add players.</p>

            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_9rem_auto]">
                <div className="relative min-w-0">
                    <KeyRound className="text-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden />
                    <input
                        id="board-code"
                        value={form.data.code}
                        onChange={(event) => form.setData('code', event.target.value.toUpperCase())}
                        placeholder="Session ID"
                        autoCapitalize="characters"
                        autoComplete="off"
                        spellCheck={false}
                        /* 16px so iOS does not zoom the page on focus. */
                        className="border-border bg-surface text-foreground placeholder:text-muted sm:text-label h-12 w-full rounded-xl border pr-3 pl-10 text-base tracking-[0.12em] uppercase"
                    />
                </div>

                <div className="min-w-0">
                    <label htmlFor="board-key" className="sr-only">
                        Session key
                    </label>
                    <input
                        id="board-key"
                        value={form.data.key}
                        onChange={(event) => form.setData('key', event.target.value.toUpperCase())}
                        placeholder="Key"
                        autoCapitalize="characters"
                        autoComplete="off"
                        spellCheck={false}
                        className="border-border bg-surface text-foreground placeholder:text-muted sm:text-label h-12 w-full rounded-xl border px-3 text-center text-base tracking-[0.2em] uppercase"
                    />
                </div>

                <Button
                    type="submit"
                    size="touch"
                    disabled={form.processing || !form.data.code.trim() || !form.data.key.trim()}
                    className="w-full sm:w-auto sm:px-6"
                >
                    {form.processing ? <Loader2 className="size-4 animate-spin" /> : 'Open board'}
                </Button>
            </div>

            {(form.errors.code || form.errors.key) && (
                <p role="alert" className="text-meta text-danger mt-2">
                    {form.errors.code ?? form.errors.key}
                </p>
            )}
        </form>
    );
}
