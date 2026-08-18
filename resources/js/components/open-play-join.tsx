import { Button } from '@/components/ui/button';
import { useForm } from '@inertiajs/react';
import { KeyRound, Loader2 } from 'lucide-react';
import { type FormEvent } from 'react';

/**
 * Join an open play session with the code the club shared.
 *
 * This is the whole player side of the new flow: type the code, you are in the
 * rotation. Staff no longer add anyone to a queue by hand.
 */
export function OpenPlayJoin({ className }: { className?: string }) {
    const form = useForm({ code: '', key: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/me/open-play/join', {
            preserveScroll: true,
            onSuccess: () => form.reset('code'),
        });
    };

    return (
        <form onSubmit={submit} className={className}>
            <label htmlFor="open-play-code" className="text-label text-foreground font-medium">
                Have a session ID and key?
            </label>
            <p className="text-meta text-muted mt-0.5">Enter both to join the rotation. The system assigns your court and partner.</p>

            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_9rem_auto]">
                <div className="relative min-w-0">
                    <KeyRound className="text-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden />
                    <input
                        id="open-play-code"
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
                    <label htmlFor="open-play-key" className="sr-only">
                        Session key
                    </label>
                    <input
                        id="open-play-key"
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
                    {form.processing ? <Loader2 className="size-4 animate-spin" /> : 'Join'}
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
