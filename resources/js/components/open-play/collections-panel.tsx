import { Button } from '@/components/ui/button';
import { currency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';

export type CollectionRow = {
    player_id: number;
    name: string;
    games: number;
    left: boolean;
    due: number;
    paid: number;
    outstanding: number;
    settled: boolean;
};

export type CollectionSheet = {
    entry_fee: number;
    due: number;
    collected: number;
    outstanding: number;
    billable: number;
    unpaid: number;
    players: CollectionRow[];
};

/**
 * What the club is owed for this session.
 *
 * Staff side only. The session board is opened with an ID and key handed out
 * at the desk, so anyone running a court could otherwise mark money as
 * collected; taking payment sits behind a login instead.
 *
 * Entry is charged per player, once, and only once they have played. Somebody
 * who checked in, waited and went home before a court came free owes nothing,
 * so they are on the list at zero rather than missing from it: staff can see
 * they were here and see why they are not being charged.
 *
 * Players who played and then left stay on the sheet, greyed but still owed.
 */
export function CollectionsPanel({ sessionId, sheet }: { sessionId: number; sheet: CollectionSheet }) {
    const [settling, setSettling] = useState<number | null>(null);

    const take = (row: CollectionRow) => {
        setSettling(row.player_id);
        router.post(
            `/open-play/${sessionId}/collect/${row.player_id}`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setSettling(null),
            },
        );
    };

    return (
        <div className="border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border">
            <div className="border-border bg-surface-muted shrink-0 border-b px-4 py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                    <p className="text-label text-foreground font-semibold">To collect</p>
                    <p data-numeric className={cn('text-label font-semibold', sheet.outstanding > 0 ? 'text-warning' : 'text-success')}>
                        {currency(sheet.outstanding)}
                    </p>
                </div>
                <p className="text-meta text-muted mt-0.5">
                    <span data-numeric>{currency(sheet.collected)}</span> in · <span data-numeric>{sheet.billable}</span>{' '}
                    {sheet.billable === 1 ? 'player' : 'players'} at <span data-numeric>{currency(sheet.entry_fee)}</span>
                </p>
            </div>

            {sheet.players.length === 0 ? (
                <p className="text-meta text-muted px-4 py-10 text-center">Nobody checked in yet.</p>
            ) : (
                <ul className="divide-border min-h-0 flex-1 divide-y overflow-y-auto">
                    {sheet.players.map((row) => (
                        <li key={row.player_id} className={cn('flex items-center gap-3 px-4 py-2.5', row.left && 'opacity-60')}>
                            <div className="min-w-0 flex-1">
                                <p className="text-label text-foreground truncate font-medium">
                                    {row.name}
                                    {row.left && <span className="text-meta text-muted ml-1.5 font-normal">· gone</span>}
                                </p>
                                <p className="text-meta text-muted">
                                    {/* The fee is for being here, so it is shown
                                        from the moment they are. Games are
                                        reported beside it as what has happened
                                        so far, not as what decides the bill. */}
                                    {row.games === 0 ? (
                                        <span>checked in</span>
                                    ) : (
                                        <>
                                            <span data-numeric>{row.games}</span> {row.games === 1 ? 'game' : 'games'}
                                        </>
                                    )}{' '}
                                    · <span data-numeric>{currency(row.due)}</span>
                                </p>
                            </div>

                            {row.due > 0 &&
                                (row.settled ? (
                                    <span className="text-meta text-success flex shrink-0 items-center gap-1 font-medium">
                                        <Check className="size-3.5" aria-hidden />
                                        paid
                                    </span>
                                ) : (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="shrink-0"
                                        disabled={settling === row.player_id}
                                        onClick={() => take(row)}
                                    >
                                        {settling === row.player_id ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            `Take ${currency(row.outstanding)}`
                                        )}
                                    </Button>
                                ))}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
