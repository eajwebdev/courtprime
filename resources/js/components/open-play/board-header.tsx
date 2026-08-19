import { BrandIcon } from '@/components/marketing-artwork';
import { Button } from '@/components/ui/button';
import { Check, CircleStop, Copy, History, LogOut } from 'lucide-react';
import { useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- payload from PublicOpenPlayBoardController. */

/**
 * The bar across the top of the board.
 *
 * The session ID and key live here rather than on a settings screen: the most
 * common thing anyone asks the person holding the tablet is "what's the code",
 * and the answer should be readable across a court without unlocking anything.
 *
 * No name is shown. The board is the session's, not one person's, and a name in
 * the chrome read as though it belonged to whoever opened it. Who did what is
 * in the history, which is where it is useful.
 */
export function BoardHeader({
    session,
    inControl,
    onShowActivity,
    onRelease,
    onEnd,
    activityCount,
}: {
    session: any;
    /** Whether this device is the one holding the board. */
    inControl: boolean;
    onShowActivity: () => void;
    onRelease: () => void;
    /** Only the host closing a session that has started. */
    onEnd?: () => void;
    activityCount: number;
}) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        await navigator.clipboard?.writeText(`${session.session_code} · key ${session.session_key}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    };

    return (
        <header className="border-border bg-surface-deep text-surface-deep-foreground z-nav sticky top-0 border-b">
            <div className="mx-auto flex w-full max-w-[120rem] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
                <BrandIcon size={34} className="size-8 shrink-0 sm:size-9" />

                <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                    <p className="text-label truncate font-semibold text-white">{session.name}</p>
                    <p className="text-meta truncate text-white/55">
                        {session.branch}
                        {session.starts_at && (
                            <>
                                {' · '}
                                <span data-numeric>
                                    {session.starts_at}–{session.ends_at}
                                </span>
                            </>
                        )}
                    </p>
                </div>

                {/* ID and key together: they are handed out together and they are
                    useless apart. */}
                <button
                    type="button"
                    onClick={copy}
                    className="flex shrink-0 items-center gap-3 rounded-lg border border-white/12 bg-white/6 px-3 py-1.5 text-left transition-colors hover:bg-white/12"
                    title="Copy the session ID and key"
                >
                    <span>
                        <span className="text-[0.625rem] tracking-wide text-white/45 uppercase">Session ID</span>
                        <span data-numeric className="block text-base leading-tight font-semibold text-white">
                            {session.session_code}
                        </span>
                    </span>
                    <span className="border-l border-white/15 pl-3">
                        <span className="text-[0.625rem] tracking-wide text-white/45 uppercase">Key</span>
                        <span data-numeric className="block text-base leading-tight font-semibold text-white">
                            {session.session_key}
                        </span>
                    </span>
                    {copied ? <Check className="size-4 shrink-0 text-white" /> : <Copy className="size-4 shrink-0 text-white/60" />}
                </button>

                <div className="flex shrink-0 items-center gap-2">
                    <Button type="button" variant="onDeep" size="sm" onClick={onShowActivity} className="shrink-0">
                        <History className="size-4" />
                        <span className="hidden sm:inline">History</span>
                        {activityCount > 0 && (
                            <span data-numeric className="text-meta">
                                {activityCount}
                            </span>
                        )}
                    </Button>

                    {/* Handing the board back is the only way somebody else can
                        take it, so it lives in the chrome rather than behind a
                        menu. */}
                    {inControl && (
                        <Button type="button" variant="onDeep" size="sm" onClick={onRelease} className="shrink-0">
                            <LogOut className="size-4" />
                            <span className="hidden sm:inline">Release</span>
                        </Button>
                    )}

                    {/* Closing the night, which is the host's call and not the
                        same as handing the board to the next person. */}
                    {inControl && onEnd && (
                        <Button type="button" variant="onDeep" size="sm" onClick={onEnd} className="shrink-0">
                            <CircleStop className="size-4" />
                            <span className="hidden sm:inline">End session</span>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
