import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { commandDestinations } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { CornerDownLeft, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type SearchResult = {
    type: string;
    title: string;
    subtitle?: string | null;
    href: string;
};

type CommandRow = { key: string; title: string; subtitle?: string | null; href: string; badge: string };

/**
 * The ⌘K command menu.
 *
 * This is the pressure valve for navigation: the sidebar stays curated at ≤7
 * items per group because every destination in the product is reachable here.
 * It searches destinations locally and records over the network.
 */
export function CommandMenu() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    /* Scoped to the signed-in role so the menu never offers a 403. */
    const { workspace } = usePage<SharedData>().props;
    const destinations = useMemo(() => commandDestinations(workspace), [workspace]);

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setOpen((value) => !value);
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        if (!open) {
            setQuery('');
            setResults([]);
            setCursor(0);
        }
    }, [open]);

    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            return;
        }

        const controller = new AbortController();
        const timeout = window.setTimeout(() => {
            setLoading(true);
            fetch(`/global-search?q=${encodeURIComponent(query)}`, {
                headers: { Accept: 'application/json' },
                signal: controller.signal,
            })
                .then((response) => response.json())
                .then((data) => setResults(data.results ?? []))
                .catch(() => setResults([]))
                .finally(() => setLoading(false));
        }, 220);

        return () => {
            controller.abort();
            window.clearTimeout(timeout);
        };
    }, [query]);

    const rows: CommandRow[] = useMemo(() => {
        const needle = query.trim().toLowerCase();

        const pages: CommandRow[] = destinations
            .filter((item) => !needle || item.title.toLowerCase().includes(needle) || (item.section ?? '').toLowerCase().includes(needle))
            .slice(0, needle ? 6 : 8)
            .map((item) => ({ key: `page-${item.url}`, title: item.title, subtitle: item.section, href: item.url, badge: 'Go to' }));

        const records: CommandRow[] = results.map((result, index) => ({
            key: `record-${result.href}-${index}`,
            title: result.title,
            subtitle: result.subtitle,
            href: result.href,
            badge: result.type,
        }));

        return [...pages, ...records];
    }, [destinations, query, results]);

    useEffect(() => {
        setCursor(0);
    }, [rows.length]);

    const onKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setCursor((value) => Math.min(rows.length - 1, value + 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setCursor((value) => Math.max(0, value - 1));
        } else if (event.key === 'Enter' && rows[cursor]) {
            event.preventDefault();
            setOpen(false);
            router.visit(rows[cursor].href);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Search CourtPrime"
                className="border-border bg-surface text-label text-muted hover:border-border-strong hover:text-foreground inline-flex h-9 items-center gap-2 rounded-md border px-2.5 transition-colors sm:w-56 sm:justify-between"
            >
                <span className="flex items-center gap-2">
                    <Search className="size-4" />
                    <span className="hidden sm:inline">Search</span>
                </span>
                <kbd className="border-border bg-surface-muted hidden rounded border px-1.5 py-0.5 text-[0.6875rem] font-medium sm:inline">⌘K</kbd>
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="top-[12vh] max-w-2xl translate-y-0 gap-0 overflow-hidden p-0">
                    <DialogTitle className="sr-only">Search CourtPrime</DialogTitle>

                    <div className="border-border border-b p-3">
                        <div className="relative">
                            <Search className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Input
                                autoFocus
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                onKeyDown={onKeyDown}
                                className="h-11 pl-9"
                                placeholder="Search pages, players, reservations…"
                                aria-label="Search CourtPrime"
                            />
                        </div>
                    </div>

                    <div ref={listRef} role="listbox" aria-label="Results" className="max-h-[56vh] overflow-y-auto p-2">
                        {rows.map((row, index) => (
                            <Link
                                key={row.key}
                                href={row.href}
                                onClick={() => setOpen(false)}
                                onMouseEnter={() => setCursor(index)}
                                role="option"
                                aria-selected={index === cursor}
                                className={cn(
                                    'flex items-center justify-between gap-3 rounded-md px-3 py-2.5 transition-colors',
                                    index === cursor ? 'bg-surface-muted' : 'hover:bg-surface-muted/60',
                                )}
                            >
                                <span className="min-w-0">
                                    <span className="text-label text-foreground block truncate font-medium">{row.title}</span>
                                    {row.subtitle && <span className="text-meta text-muted block truncate">{row.subtitle}</span>}
                                </span>
                                <span className="flex shrink-0 items-center gap-2">
                                    <span className="bg-surface-muted text-meta text-secondary rounded-full px-2 py-0.5 font-medium capitalize">
                                        {row.badge}
                                    </span>
                                    {index === cursor && <CornerDownLeft className="text-muted size-3.5" />}
                                </span>
                            </Link>
                        ))}

                        {loading && <p className="text-label text-muted px-3 py-6 text-center">Searching…</p>}
                        {!loading && query.trim().length >= 2 && rows.length === 0 && (
                            <p className="text-label text-muted px-3 py-6 text-center">No matching pages or records.</p>
                        )}
                    </div>

                    <div className="border-border bg-surface-muted text-meta text-muted flex items-center gap-4 border-t px-3 py-2">
                        <span>↑↓ to navigate</span>
                        <span>↵ to open</span>
                        <span>esc to close</span>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

/** @deprecated Renamed to `CommandMenu`; this alias keeps existing imports working. */
export const GlobalSearch = CommandMenu;
