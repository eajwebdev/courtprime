import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { Camera, QrCode, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Minimal shape of the Barcode Detection API. Not in TypeScript's DOM lib
 * because it is not implemented everywhere — which is the whole reason this
 * component checks for it before offering to open the camera.
 */
type DetectedBarcode = { rawValue: string };
type BarcodeDetectorLike = { detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]> };
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

function detectorCtor(): BarcodeDetectorCtor | null {
    const ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;

    return typeof ctor === 'function' ? ctor : null;
}

/**
 * Scanning the club's QR from inside CourtPrime.
 *
 * Every phone camera app already reads a QR and opens the link, so this is not
 * the only way in and must never pretend to be: it saves a player who already
 * has this page open from switching apps, and where the browser cannot do it
 * the button says so and points at the camera instead of failing quietly.
 *
 * Only our own join links are followed. A QR is a URL somebody else printed,
 * and a scanner that navigates anywhere it is pointed is a redirect hole.
 */
export function ScanToJoin({ className }: { className?: string }) {
    const [open, setOpen] = useState(false);
    const supported = typeof window !== 'undefined' && detectorCtor() !== null && Boolean(navigator.mediaDevices?.getUserMedia);

    return (
        <>
            <Button type="button" variant="outline" size="touch" onClick={() => setOpen(true)} className={className}>
                <QrCode className="size-4" aria-hidden />
                Scan QR
            </Button>

            {open && (supported ? <Scanner onClose={() => setOpen(false)} /> : <CameraHint onClose={() => setOpen(false)} />)}
        </>
    );
}

function Scanner({ onClose }: { onClose: () => void }) {
    const video = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const Ctor = detectorCtor();

        if (!Ctor) {
            return;
        }

        let stream: MediaStream | null = null;
        let frame = 0;
        let done = false;
        const detector = new Ctor({ formats: ['qr_code'] });

        const stop = () => {
            done = true;
            cancelAnimationFrame(frame);
            stream?.getTracks().forEach((track) => track.stop());
        };

        const scan = async () => {
            if (done || !video.current || video.current.readyState !== video.current.HAVE_ENOUGH_DATA) {
                frame = requestAnimationFrame(scan);

                return;
            }

            try {
                const [found] = await detector.detect(video.current);

                if (found) {
                    /* Same origin and our own join path, or it is somebody
                       else's QR and we do nothing with it. */
                    const url = new URL(found.rawValue, window.location.origin);

                    if (url.origin === window.location.origin && url.pathname === '/open-play/join') {
                        stop();
                        onClose();
                        router.get(url.pathname + url.search);

                        return;
                    }

                    setError('That is not a CourtPrime session code.');
                }
            } catch {
                /* A frame that could not be read is not an error worth showing;
                   the next one is a few milliseconds away. */
            }

            frame = requestAnimationFrame(scan);
        };

        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: 'environment' } })
            .then((granted) => {
                stream = granted;

                if (video.current) {
                    video.current.srcObject = granted;
                    void video.current.play();
                }

                frame = requestAnimationFrame(scan);
            })
            .catch(() => setError('CourtPrime could not open the camera. Check the permission, or use your phone camera app.'));

        return stop;
    }, [onClose]);

    return (
        <Shell onClose={onClose} title="Point at the club's QR">
            <div className="bg-surface-deep relative aspect-square w-full overflow-hidden rounded-xl">
                <video ref={video} playsInline muted className="size-full object-cover" />
                {/* A frame to aim with, rather than a full-bleed camera that
                    gives no clue how close to stand. */}
                <div className="border-primary pointer-events-none absolute inset-8 rounded-xl border-2" aria-hidden />
            </div>

            {error && (
                <p role="alert" className="text-meta text-danger mt-3">
                    {error}
                </p>
            )}
        </Shell>
    );
}

/**
 * What to do on a browser without the Barcode Detection API — Safari, which is
 * most of the phones at a pickleball court. The camera app reads it there, so
 * that is what this says rather than offering a button that cannot work.
 */
function CameraHint({ onClose }: { onClose: () => void }) {
    return (
        <Shell onClose={onClose} title="Use your camera app">
            <div className="text-body text-secondary space-y-3">
                <p className="text-foreground flex items-start gap-2.5">
                    <Camera className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                    Open your phone's camera and point it at the club's QR code. Tap the link that appears and you are in the queue.
                </p>
                <p className="text-meta text-muted">
                    This browser cannot open the camera from inside a page. Typing the session ID and key works too.
                </p>
            </div>
        </Shell>
    );
}

function Shell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="z-modal fixed inset-0">
            <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70" />

            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="bg-surface shadow-e3 absolute top-1/2 left-1/2 w-[min(92vw,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl p-5"
            >
                <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-h3 text-foreground">{title}</p>
                    <Button type="button" variant="ghost" size="iconSm" aria-label="Close" onClick={onClose}>
                        <X className="size-4" />
                    </Button>
                </div>

                {children}
            </div>
        </div>
    );
}
