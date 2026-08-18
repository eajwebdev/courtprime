import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Loader2, UserPlus, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';

export type RosterEntry = {
    player_id: number;
    name: string;
    skill_level?: string | number | null;
    games: number;
    wins: number;
};

/**
 * Who is here.
 *
 * Adding is the first thing anyone does on this board and the thing they do
 * most, so the field sits at the top and keeps focus after each submit: a name,
 * enter, a name, enter, straight down the list of people who walked in.
 */
export function RosterPanel({
    base,
    roster,
    className,
    step = true,
    hideHeading = false,
}: {
    base: string;
    roster: RosterEntry[];
    className?: string;
    /** The setup screen numbers its columns; a running board does not. */
    step?: boolean;
    /** The running board's rail already names this panel on its tab. */
    hideHeading?: boolean;
}) {
    const form = useForm({ name: '' });
    const [removing, setRemoving] = useState<number | null>(null);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(`${base}/players`, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => form.reset(),
        });
    };

    const remove = (playerId: number) => {
        setRemoving(playerId);
        router.delete(`${base}/players/${playerId}`, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setRemoving(null),
        });
    };

    return (
        <section className={cn('flex min-h-0 flex-col gap-4', className)}>
            <header className={cn(hideHeading && 'hidden')}>
                {step && (
                    <p className={cn('text-eyebrow uppercase', roster.length >= 4 ? 'text-success' : 'text-muted')}>
                        {roster.length >= 4 ? '✓ ' : ''}Step 3 of 3
                    </p>
                )}
                <h2 className={cn('text-h2 text-foreground', step && 'mt-1')}>Players</h2>
            </header>

            <form onSubmit={submit}>
                <label htmlFor="add-player" className="text-label text-foreground font-medium">
                    Add whoever turns up
                </label>
                <p className="text-meta text-muted mt-0.5">No account needed. They get a real record either way.</p>

                <div className="mt-2 flex gap-2">
                    <div className="relative min-w-0 flex-1">
                        <UserPlus className="text-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden />
                        <input
                            id="add-player"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                            placeholder="Type a name and press enter"
                            autoComplete="off"
                            className="border-border bg-surface text-foreground placeholder:text-muted h-12 w-full rounded-xl border pr-3 pl-10 text-base"
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

            <div className="border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border">
                <div className="border-border bg-surface-muted flex items-center justify-between gap-3 border-b px-4 py-2.5">
                    <p className="text-label text-foreground font-semibold">Checked in</p>
                    <p className="text-meta text-muted">
                        <span data-numeric className="text-foreground font-semibold">
                            {roster.length}
                        </span>{' '}
                        {roster.length === 1 ? 'player' : 'players'}
                    </p>
                </div>

                {/* The card is a fixed height and the list scrolls inside it, so
                    adding a twentieth player does not push the rest of the board
                    off the screen. */}
                {roster.length === 0 ? (
                    <p className="text-meta text-muted px-4 py-10 text-center">No one checked in yet.</p>
                ) : (
                    <ul className="divide-border h-full divide-y overflow-y-auto">
                        {roster.map((entry) => (
                            <li key={entry.player_id} className="flex items-center gap-3 px-4 py-2.5">
                                <div className="min-w-0 flex-1">
                                    <p className="text-label text-foreground truncate font-medium">{entry.name}</p>
                                    {entry.games > 0 && (
                                        <p className="text-meta text-muted">
                                            <span data-numeric>{entry.games}</span> {entry.games === 1 ? 'game' : 'games'} ·{' '}
                                            <span data-numeric>{entry.wins}</span> won
                                        </p>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="iconSm"
                                    aria-label={`Remove ${entry.name}`}
                                    onClick={() => remove(entry.player_id)}
                                    disabled={removing === entry.player_id}
                                    className="text-muted hover:text-danger shrink-0"
                                >
                                    {removing === entry.player_id ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
