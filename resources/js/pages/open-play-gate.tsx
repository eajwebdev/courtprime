import { BrandWordmarkAuto } from '@/components/marketing-artwork';
import { Button } from '@/components/ui/button';
import { Head, useForm } from '@inertiajs/react';
import { KeyRound, Loader2, TriangleAlert } from 'lucide-react';
import { type FormEvent } from 'react';

/**
 * The way in to a session board.
 *
 * Two credentials, because the ID alone is on a screen at the club and runs in
 * an obvious sequence. Nothing about a session — not its name, not its club —
 * is shown until both are right.
 */
export default function OpenPlayGate() {
    const form = useForm({ code: '', key: '', who: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/open-play/board', { preserveScroll: true });
    };

    return (
        <div className="bg-background text-foreground flex min-h-svh flex-col">
            <Head title="Open play board | CourtPrime" />

            <header className="border-border border-b">
                <div className="mx-auto flex h-14 w-full max-w-3xl items-center px-4">
                    <BrandWordmarkAuto height={28} className="h-7" />
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
                <div className="bg-surface-deep text-surface-deep-foreground mb-5 rounded-2xl px-5 py-5">
                    <p className="text-eyebrow text-primary uppercase">Open play</p>
                    <h1 className="mt-1 text-[1.5rem] leading-tight font-semibold tracking-tight text-white">Open your session board</h1>
                    <p className="text-meta mt-1.5 text-white/55">Enter the session ID and key the club gave you.</p>
                </div>

                <form onSubmit={submit} className="border-border bg-surface rounded-xl border p-4 sm:p-5">
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
            </main>
        </div>
    );
}
