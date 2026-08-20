import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SessionQr = { path: string; modules: number; url: string };

/**
 * The code players point a phone at to join.
 *
 * The matrix comes from the server as an SVG path (App\Support\Qr), so it is
 * in the document at first paint and scales to whatever it is given without a
 * script running — which is what a courtside TV needs.
 *
 * Always dark modules on a white plate, whatever the surface underneath. A QR
 * inverted, tinted, or sat on navy is a QR that half the phones at the court
 * will not read, and there is no styling win worth that.
 */
export function SessionQr({ qr, className, size = 160 }: { qr: SessionQr; className?: string; size?: number }) {
    /*
     * The full four modules of quiet zone the spec asks for, inside the
     * viewBox — not CSS padding around it.
     *
     * Padding is measured in pixels and the code in modules, so a fixed plate
     * padding works out at a different quiet zone at every size — about two
     * here. Readers cope with that on a clean screen and struggle with it on a
     * printed poster read across a court. Drawn in, it is four at every size.
     */
    const quiet = 4;
    const span = qr.modules + quiet * 2;

    return (
        <svg
            viewBox={`0 0 ${span} ${span}`}
            width={size}
            height={size}
            className={cn('rounded-lg', className)}
            role="img"
            aria-label="Scan to join this open play session"
        >
            {/* White belongs to the image. A transparent QR over a tinted
                surface is a QR that does not scan. */}
            <rect width={span} height={span} fill="#ffffff" />
            <g transform={`translate(${quiet} ${quiet})`}>
                {/* No shapeRendering="crispEdges": snapping every module to
                    whole device pixels made them uneven widths at fractional
                    scales, which is exactly what a decoder cannot tolerate. */}
                <path d={qr.path} fill="#000000" />
            </g>
        </svg>
    );
}

/**
 * The QR, big, for turning the tablet around.
 *
 * A code in the header would be a centimetre across on a phone and unscannable
 * from where players stand, so it is a thing you open deliberately: tap, turn
 * the screen to the group, they scan and they are in the queue as themselves.
 *
 * The ID and key stay on screen underneath. Somebody's camera will refuse, and
 * reading two short strings out loud is the fallback that always works.
 */
export function JoinQrOverlay({
    qr,
    session,
    open,
    onClose,
}: {
    qr: SessionQr;
    session: { name: string; session_code: string; session_key: string };
    open: boolean;
    onClose: () => void;
}) {
    if (!open) return null;

    return (
        <div className="z-modal fixed inset-0">
            <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70" />

            <div
                role="dialog"
                aria-modal="true"
                aria-label="Scan to join this session"
                className="bg-surface shadow-e3 absolute top-1/2 left-1/2 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 text-center"
            >
                <p className="text-eyebrow text-primary uppercase">Scan to join</p>
                <h2 className="text-h2 text-foreground mt-1">{session.name}</h2>
                <p className="text-meta text-muted mt-1">Point a phone camera at this. It opens the join page — it does not hand over the board.</p>

                <div className="mt-5 flex justify-center">
                    <SessionQr qr={qr} size={248} />
                </div>

                <div className="border-border mt-5 flex items-center justify-center gap-4 rounded-xl border py-3">
                    <span>
                        <span className="text-meta text-muted block uppercase">Session ID</span>
                        <span data-numeric className="text-foreground block text-lg leading-tight font-semibold">
                            {session.session_code}
                        </span>
                    </span>
                    <span className="border-border border-l pl-4">
                        <span className="text-meta text-muted block uppercase">Key</span>
                        <span data-numeric className="text-foreground block text-lg leading-tight font-semibold">
                            {session.session_key}
                        </span>
                    </span>
                </div>

                <Button type="button" variant="outline" size="touch" onClick={onClose} className="mt-5 w-full">
                    Done
                </Button>
            </div>
        </div>
    );
}
