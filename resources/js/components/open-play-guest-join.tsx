import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { KeyRound, Loader2, User } from 'lucide-react';
import { type FormEvent } from 'react';

/**
 * Joining without an account.
 *
 * Open play is drop-in: someone turns up, is handed the code and wants to
 * play. Making them register first is the one thing that stops that. A name
 * and the code is enough — the club gets a real player record either way, and
 * the person can claim it later by signing up with the same details.
 */
export function OpenPlayGuestJoin({ className }: { className?: string }) {
    const form = useForm({ code: '', key: '', name: '', mobile_number: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/open-play/join', {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <form onSubmit={submit} className={className}>
            <p className="text-label text-foreground font-medium">Joining without an account?</p>
            <p className="text-meta text-muted mt-0.5">Enter the session ID, its key and your name. No sign-up needed to play today.</p>

            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_8rem_1fr_auto]">
                <div className="relative">
                    <Label htmlFor="guest-code" className="sr-only">
                        Session code
                    </Label>
                    <KeyRound className="text-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden />
                    <input
                        id="guest-code"
                        value={form.data.code}
                        onChange={(event) => form.setData('code', event.target.value.toUpperCase())}
                        placeholder="Session ID"
                        autoCapitalize="characters"
                        autoComplete="off"
                        spellCheck={false}
                        className="border-border bg-surface text-foreground placeholder:text-muted sm:text-label h-12 w-full rounded-xl border pr-3 pl-10 text-base tracking-[0.12em] uppercase"
                    />
                </div>

                <div className="min-w-0">
                    <Label htmlFor="guest-key" className="sr-only">
                        Session key
                    </Label>
                    <input
                        id="guest-key"
                        value={form.data.key}
                        onChange={(event) => form.setData('key', event.target.value.toUpperCase())}
                        placeholder="Key"
                        autoCapitalize="characters"
                        autoComplete="off"
                        spellCheck={false}
                        className="border-border bg-surface text-foreground placeholder:text-muted sm:text-label h-12 w-full rounded-xl border px-3 text-center text-base tracking-[0.2em] uppercase"
                    />
                </div>

                <div className="relative">
                    <Label htmlFor="guest-name" className="sr-only">
                        Your name
                    </Label>
                    <User className="text-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden />
                    <input
                        id="guest-name"
                        value={form.data.name}
                        onChange={(event) => form.setData('name', event.target.value)}
                        placeholder="Your name"
                        autoComplete="name"
                        className="border-border bg-surface text-foreground placeholder:text-muted sm:text-label h-12 w-full rounded-xl border pr-3 pl-10 text-base"
                    />
                </div>

                <Button
                    type="submit"
                    size="touch"
                    disabled={form.processing || !form.data.code.trim() || !form.data.key.trim() || form.data.name.trim().length < 2}
                    className="w-full sm:w-auto sm:px-8"
                >
                    {form.processing ? <Loader2 className="size-4 animate-spin" /> : 'Join'}
                </Button>
            </div>

            {(form.errors.code || form.errors.key || form.errors.name) && (
                <p role="alert" className="text-meta text-danger mt-2">
                    {form.errors.code ?? form.errors.key ?? form.errors.name}
                </p>
            )}
        </form>
    );
}
