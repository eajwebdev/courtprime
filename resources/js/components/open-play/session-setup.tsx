import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { Check, Loader2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';

export type BoardCourt = { id: number; name: string; status?: string | null };

type SessionShape = {
    name: string;
    format: string;
    target_score: number;
    win_by_two: boolean;
    max_players: number | null;
};

const TARGETS = [11, 15, 21];

/**
 * Everything about the session that the people at the court can change.
 *
 * Laid out as three columns on a tablet in landscape, which is how this is
 * actually used: propped up at the net post while somebody works down the list
 * of who turned up. Each column is one decision, and none of them is buried
 * behind a dialog, because a dialog on a shared tablet is a step somebody else
 * has to undo.
 */
export function SessionSetup({
    base,
    session,
    branchCourts,
    selectedCourtIds,
    children,
    history,
}: {
    base: string;
    session: SessionShape;
    branchCourts: BoardCourt[];
    selectedCourtIds: number[];
    /** The roster panel, rendered as the third column. */
    children: ReactNode;
    /** Session history, wide screens only, where there is a column spare. */
    history?: ReactNode;
}) {
    const form = useForm({
        name: session.name ?? '',
        format: session.format ?? 'doubles',
        target_score: Number(session.target_score ?? 11),
        win_by_two: Boolean(session.win_by_two),
        max_players: session.max_players,
        court_ids: selectedCourtIds,
    });

    const [custom, setCustom] = useState(!TARGETS.includes(Number(session.target_score ?? 11)));

    /*
     * Not a <form>. The roster panel below is one, and it has to be, because
     * typing a name and pressing enter is how people are added. Nesting forms
     * is invalid, and enter in the name field would have submitted the settings
     * instead of adding the player.
     */
    const save = () => form.post(`${base}/settings`, { preserveScroll: true, preserveState: true });

    /* The session runs on every court picked here, and the rotation spreads
       whoever is waiting across all of them. */
    const toggleCourt = (id: number) => {
        form.setData('court_ids', form.data.court_ids.includes(id) ? form.data.court_ids.filter((c) => c !== id) : [...form.data.court_ids, id]);
    };

    return (
        <div className="grid gap-x-6 gap-y-8 md:grid-cols-2 lg:h-full lg:grid-cols-3 2xl:grid-cols-4">
            <Column step="Step 1 of 3" title="Session details" done={form.data.name.trim().length > 1 && form.data.court_ids.length > 0}>
                <Field label="Session name" htmlFor="session-name">
                    <input
                        id="session-name"
                        value={form.data.name}
                        onChange={(event) => form.setData('name', event.target.value)}
                        /* 16px so a tablet or phone does not zoom on focus. */
                        className="border-border bg-surface text-foreground h-12 w-full rounded-xl border px-3.5 text-base"
                    />
                </Field>

                <Field
                    label="Courts in play"
                    hint={
                        branchCourts.length === 0
                            ? 'This branch has no courts set up.'
                            : `${form.data.court_ids.length} of ${branchCourts.length} selected`
                    }
                >
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                        {branchCourts.map((court) => {
                            const on = form.data.court_ids.includes(court.id);

                            return (
                                <button
                                    key={court.id}
                                    type="button"
                                    onClick={() => toggleCourt(court.id)}
                                    aria-pressed={on}
                                    className={cn(
                                        'flex h-12 items-center justify-center gap-1.5 rounded-xl border px-3 text-center transition-colors',
                                        on
                                            ? 'border-primary bg-primary-soft text-primary font-semibold'
                                            : 'border-border bg-surface text-secondary hover:border-border-strong',
                                    )}
                                >
                                    {on && <Check className="size-3.5 shrink-0" aria-hidden />}
                                    <span className="text-label truncate">{court.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </Field>

                <Field label="Player cap" hint="Leave empty for no limit." htmlFor="max-players">
                    <input
                        id="max-players"
                        type="number"
                        inputMode="numeric"
                        min={4}
                        max={200}
                        value={form.data.max_players ?? ''}
                        onChange={(event) => form.setData('max_players', event.target.value === '' ? null : Number(event.target.value))}
                        placeholder="No limit"
                        className="border-border bg-surface text-foreground h-12 w-full rounded-xl border px-3.5 text-base tabular-nums"
                    />
                </Field>
            </Column>

            <Column step="Step 2 of 3" title="Match settings" done>
                <Field label="Format" hint={form.data.format === 'singles' ? 'Two on a court, one each side.' : 'Four on a court, two each side.'}>
                    <div className="grid grid-cols-2 gap-2">
                        <SegmentButton active={form.data.format === 'doubles'} onClick={() => form.setData('format', 'doubles')}>
                            Doubles
                        </SegmentButton>
                        <SegmentButton active={form.data.format === 'singles'} onClick={() => form.setData('format', 'singles')}>
                            Singles
                        </SegmentButton>
                    </div>
                </Field>

                <Field label="Games to" hint="Applies to every match this session creates from now on.">
                    <div className="grid grid-cols-4 gap-2">
                        {TARGETS.map((target) => (
                            <SegmentButton
                                key={target}
                                active={!custom && form.data.target_score === target}
                                onClick={() => {
                                    setCustom(false);
                                    form.setData('target_score', target);
                                }}
                            >
                                <span data-numeric>{target}</span>
                            </SegmentButton>
                        ))}
                        <SegmentButton active={custom} onClick={() => setCustom(true)}>
                            Other
                        </SegmentButton>
                    </div>

                    {custom && (
                        <input
                            type="number"
                            inputMode="numeric"
                            min={7}
                            max={31}
                            aria-label="Custom target score"
                            value={form.data.target_score}
                            onChange={(event) => form.setData('target_score', Number(event.target.value))}
                            className="border-border bg-surface text-foreground mt-2 h-12 w-full rounded-xl border px-3.5 text-base tabular-nums"
                        />
                    )}
                </Field>

                <Field label="Win by two" hint="At the target, a one point lead does not end it.">
                    <div className="grid grid-cols-2 gap-2">
                        <SegmentButton active={form.data.win_by_two} onClick={() => form.setData('win_by_two', true)}>
                            Win by 2
                        </SegmentButton>
                        <SegmentButton active={!form.data.win_by_two} onClick={() => form.setData('win_by_two', false)}>
                            First to {form.data.target_score}
                        </SegmentButton>
                    </div>
                </Field>

                {form.errors.target_score && (
                    <p role="alert" className="text-meta text-danger">
                        {form.errors.target_score}
                    </p>
                )}
            </Column>

            <div className="border-border md:col-span-2 lg:col-span-1 lg:flex lg:min-h-0 lg:flex-col lg:border-l lg:pl-6">{children}</div>

            {/* A fourth column only exists on a genuinely wide screen. Below
                that the history stays behind the header button. */}
            {history && <div className="border-border hidden min-h-0 2xl:flex 2xl:flex-col 2xl:border-l 2xl:pl-6">{history}</div>}

            {/* Saving is explicit. Several devices can be on this board at once,
                and a field that saved as you typed would fight whoever else is
                editing. */}
            {form.isDirty && (
                <div className="border-border z-sticky bg-surface/95 sticky bottom-20 -mx-4 flex items-center justify-between gap-3 border-t px-4 py-3 backdrop-blur-md md:col-span-2 lg:col-span-3 2xl:col-span-4">
                    <p className="text-meta text-muted">Unsaved changes</p>
                    <Button type="button" size="touch" onClick={save} disabled={form.processing}>
                        {form.processing ? <Loader2 className="size-4 animate-spin" /> : 'Save changes'}
                    </Button>
                </div>
            )}
        </div>
    );
}

function Column({ step, title, done, children }: { step: string; title: string; done?: boolean; children: ReactNode }) {
    return (
        <section className="border-border flex flex-col gap-5 md:border-l md:pl-6 md:first:border-l-0 md:first:pl-0 lg:min-h-0 lg:overflow-y-auto">
            <header>
                <p className={cn('text-eyebrow uppercase', done ? 'text-success' : 'text-muted')}>
                    {done ? '✓ ' : ''}
                    {step}
                </p>
                <h2 className="text-h2 text-foreground mt-1">{title}</h2>
            </header>
            {children}
        </section>
    );
}

function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: ReactNode }) {
    return (
        <div>
            <label htmlFor={htmlFor} className="text-label text-foreground font-medium">
                {label}
            </label>
            {hint && <p className="text-meta text-muted mt-0.5">{hint}</p>}
            <div className="mt-2">{children}</div>
        </div>
    );
}

function SegmentButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'text-label flex h-12 items-center justify-center rounded-xl border px-2 text-center transition-colors',
                active
                    ? 'border-primary bg-primary-soft text-primary font-semibold'
                    : 'border-border bg-surface text-secondary hover:border-border-strong',
            )}
        >
            {children}
        </button>
    );
}
