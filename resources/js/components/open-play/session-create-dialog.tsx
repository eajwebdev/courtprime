import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { type FormEvent, type ReactNode } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- branch payload comes from OpenPlayController. */

/** Local date parts, not toISOString, which is UTC and a day behind in Manila. */
function today() {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Starting a session.
 *
 * This used to be a permanent block down the middle of the page, between the
 * courts and the session list, so running tonight's session meant scrolling
 * past a form for a session that did not exist yet. A club starts one of these
 * a day at most; it does not need to be on screen the rest of the time.
 */
export function SessionCreateDialog({ open, onOpenChange, branches }: { open: boolean; onOpenChange: (open: boolean) => void; branches: any[] }) {
    const form = useForm({
        branch_id: branches[0]?.id ?? '',
        name: 'Open Play',
        format: 'doubles',
        session_code: '',
        court_ids: [] as number[],
        session_date: today(),
        start_time: '19:00',
        end_time: '22:00',
        entry_fee: 200,
    });

    const branch = branches.find((entry) => entry.id === Number(form.data.branch_id)) ?? branches[0];
    const courts: any[] = branch?.courts ?? [];

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/open-play', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            },
        });
    };

    const toggleCourt = (courtId: number) => {
        form.setData(
            'court_ids',
            form.data.court_ids.includes(courtId) ? form.data.court_ids.filter((id) => id !== courtId) : [...form.data.court_ids, courtId],
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Start a session</DialogTitle>
                    <DialogDescription>Pick the courts and share the ID and key. The rotation handles who plays whom.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Session name" htmlFor="name" error={form.errors.name} className="sm:col-span-2">
                            <Input id="name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} />
                        </Field>

                        <Field label="Branch" htmlFor="branch" className="sm:col-span-2">
                            <select
                                id="branch"
                                className="border-border bg-surface text-foreground text-body h-10 w-full rounded-md border px-3"
                                value={form.data.branch_id}
                                onChange={(event) => {
                                    form.setData('branch_id', Number(event.target.value));
                                    form.setData('court_ids', []);
                                }}
                            >
                                {branches.map((entry) => (
                                    <option key={entry.id} value={entry.id}>
                                        {entry.name}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Format" htmlFor="format" className="sm:col-span-2">
                            <select
                                id="format"
                                className="border-border bg-surface text-foreground text-body h-10 w-full rounded-md border px-3"
                                value={form.data.format}
                                onChange={(event) => form.setData('format', event.target.value)}
                            >
                                <option value="doubles">Doubles · four on a court</option>
                                <option value="singles">Singles · two on a court</option>
                            </select>
                        </Field>

                        <Field label="Date" htmlFor="session_date" error={form.errors.session_date}>
                            <Input
                                id="session_date"
                                type="date"
                                value={form.data.session_date}
                                onChange={(event) => form.setData('session_date', event.target.value)}
                            />
                        </Field>

                        <Field label="Entry fee" htmlFor="entry_fee" error={form.errors.entry_fee}>
                            <Input
                                id="entry_fee"
                                type="number"
                                value={form.data.entry_fee}
                                onChange={(event) => form.setData('entry_fee', Number(event.target.value))}
                            />
                        </Field>

                        <Field label="Start" htmlFor="start_time" error={form.errors.start_time}>
                            <Input
                                id="start_time"
                                type="time"
                                value={form.data.start_time}
                                onChange={(event) => form.setData('start_time', event.target.value)}
                            />
                        </Field>

                        <Field label="End" htmlFor="end_time" error={form.errors.end_time}>
                            <Input
                                id="end_time"
                                type="time"
                                value={form.data.end_time}
                                onChange={(event) => form.setData('end_time', event.target.value)}
                            />
                        </Field>
                    </div>

                    <div className="border-border border-t pt-5">
                        <Label>
                            Courts for this session
                            <span className="text-muted ml-1 font-normal">only these are used</span>
                        </Label>

                        {courts.length === 0 ? (
                            <p className="text-meta text-muted border-border mt-2.5 rounded-lg border border-dashed px-4 py-6 text-center">
                                This branch has no courts yet.
                            </p>
                        ) : (
                            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {courts.map((court: any) => {
                                    const selected = form.data.court_ids.includes(court.id);

                                    return (
                                        <button
                                            key={court.id}
                                            type="button"
                                            aria-pressed={selected}
                                            onClick={() => toggleCourt(court.id)}
                                            className={cn(
                                                'text-label flex min-h-11 items-center justify-center rounded-lg border px-2 text-center leading-tight font-medium transition-colors',
                                                selected
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-border bg-surface text-secondary hover:border-border-strong hover:text-foreground',
                                            )}
                                        >
                                            {court.name}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {form.errors.court_ids && <p className="text-meta text-danger mt-2">{form.errors.court_ids}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing || form.data.court_ids.length === 0}>
                            {form.processing ? <Loader2 className="size-4 animate-spin" /> : 'Create session'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    label,
    htmlFor,
    error,
    className,
    children,
}: {
    label: string;
    htmlFor: string;
    error?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            {error && (
                <p role="alert" className="text-meta text-danger">
                    {error}
                </p>
            )}
        </div>
    );
}
