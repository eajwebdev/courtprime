import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Loader2, Search, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';

export type RosterEntry = {
    player_id: number;
    name: string;
    skill_level?: string | number | null;
    games: number;
    wins: number;
};

type Suggestion = { id: number; name: string; skill_level?: string | null; rating?: string | number | null; hint?: string | null };

/**
 * Who is here.
 *
 * Adding is the first thing anyone does on this board and the thing they do
 * most, so the field sits at the top and keeps focus after each submit.
 *
 * It searches the club's members as you type. Picking one attaches the games to
 * that person's real record; typing a name that matches nobody creates a new
 * player. Before this the field only ever took a name, and matching never
 * looked at names, so adding an existing member quietly built them a duplicate
 * profile and their wins went nowhere.
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
    const form = useForm<{ name: string; player_id: number | null }>({ name: '', player_id: null });
    const [removing, setRemoving] = useState<number | null>(null);
    const [matches, setMatches] = useState<Suggestion[]>([]);
    const [searching, setSearching] = useState(false);
    const input = useRef<HTMLInputElement>(null);

    const term = form.data.name.trim();

    /* Look up members as they type. Aborted on each keystroke so a slow reply
       cannot overwrite the results for a longer term typed after it. */
    useEffect(() => {
        if (term.length < 2) {
            setMatches([]);

            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setSearching(true);
            try {
                const response = await fetch(`${base}/players/search?q=${encodeURIComponent(term)}`, {
                    signal: controller.signal,
                    headers: { Accept: 'application/json' },
                });
                const data = await response.json();
                setMatches(data.players ?? []);
            } catch {
                /* Aborted or offline: the field still works as a plain name. */
            } finally {
                setSearching(false);
            }
        }, 220);

        return () => {
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [term, base]);

    const add = (data: { name: string; player_id: number | null }) => {
        router.post(`${base}/players`, data, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                form.reset();
                setMatches([]);
                input.current?.focus();
            },
        });
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (term.length < 2) return;

        add({ name: term, player_id: null });
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

            <form onSubmit={submit} className="relative shrink-0">
                <label htmlFor="add-player" className="text-label text-foreground font-medium">
                    Add whoever turns up
                </label>
                <p className="text-meta text-muted mt-0.5">Search members, or type a new name.</p>

                <div className="mt-2 flex gap-2">
                    <div className="relative min-w-0 flex-1">
                        {searching ? (
                            <Loader2 className="text-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 animate-spin" />
                        ) : (
                            <Search className="text-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden />
                        )}
                        <input
                            id="add-player"
                            ref={input}
                            value={form.data.name}
                            onChange={(event) => form.setData({ name: event.target.value, player_id: null })}
                            placeholder="Type a name"
                            autoComplete="off"
                            role="combobox"
                            aria-expanded={matches.length > 0}
                            aria-controls="member-matches"
                            className="border-border bg-surface text-foreground placeholder:text-muted h-12 w-full rounded-xl border pr-3 pl-10 text-base"
                        />
                    </div>
                    <Button type="submit" size="touch" disabled={form.processing || term.length < 2} className="shrink-0">
                        {form.processing ? <Loader2 className="size-4 animate-spin" /> : 'Add'}
                    </Button>
                </div>

                {matches.length > 0 && (
                    <ul
                        id="member-matches"
                        className="border-border bg-surface-raised shadow-e2 absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border"
                    >
                        <li className="text-meta text-muted border-border bg-surface-muted border-b px-3 py-1.5">Members at this club</li>
                        {matches.map((match) => (
                            <li key={match.id}>
                                {/* Picking one adds them by id, which is what
                                    keeps the games on their own record. */}
                                <button
                                    type="button"
                                    onClick={() => add({ name: match.name, player_id: match.id })}
                                    className="hover:bg-surface-muted flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors"
                                >
                                    <span className="text-label text-foreground min-w-0 truncate font-medium">{match.name}</span>
                                    <span className="text-meta text-muted shrink-0">
                                        {match.skill_level ?? ''}
                                        {match.hint ? ` · ${match.hint}` : ''}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {form.errors.name && (
                    <p role="alert" className="text-meta text-danger mt-2">
                        {form.errors.name}
                    </p>
                )}
            </form>

            <div className="border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border">
                <div className="border-border bg-surface-muted flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5">
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
