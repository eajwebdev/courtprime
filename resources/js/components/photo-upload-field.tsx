import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Camera, ImageUp, Trash2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

type PhotoUploadFieldProps = {
    label: string;
    hint?: string;
    /** Persisted URL from the server, if the player already uploaded one. */
    currentUrl?: string | null;
    /** `avatar` crops to a circle, `action` keeps a tall 3:4 frame. */
    shape?: 'avatar' | 'action';
    /**
     * `row` puts the preview beside its controls, which is right for a field
     * that owns the full width. `column` stacks them from `sm` up, for fields
     * sitting side by side in a grid where a row leaves no width for either
     * half. Below `sm` a grid is one column again, so it stays a row there.
     */
    layout?: 'row' | 'column';
    error?: string;
    onSelect: (file: File | null) => void;
    onRemove: () => void;
    /** Initials shown when there is no photo at all. */
    fallback?: string;
};

/**
 * Optional photo picker with a local preview.
 *
 * Everything is optional by design: a player with no photos sees initials and
 * is never blocked. Validation runs client-side first so an oversized file is
 * rejected before it is uploaded, then again server-side.
 */
export function PhotoUploadField({
    label,
    hint,
    currentUrl,
    shape = 'avatar',
    layout = 'row',
    error,
    onSelect,
    onRemove,
    fallback = '',
}: PhotoUploadFieldProps) {
    const inputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const [removed, setRemoved] = useState(false);

    /* Object URLs must be revoked or the tab leaks memory on repeated picks. */
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const shown = preview ?? (removed ? null : (currentUrl ?? null));

    const pick = (file: File | null) => {
        setLocalError(null);

        if (!file) return;

        if (!ACCEPTED.includes(file.type)) {
            setLocalError('Use a JPG, PNG or WebP image.');
            return;
        }
        if (file.size > MAX_BYTES) {
            setLocalError(`That image is ${(file.size / 1024 / 1024).toFixed(1)}MB. Keep it under 4MB.`);
            return;
        }

        if (preview) URL.revokeObjectURL(preview);
        setPreview(URL.createObjectURL(file));
        setRemoved(false);
        onSelect(file);
    };

    const clear = () => {
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        setRemoved(true);
        setLocalError(null);
        if (inputRef.current) inputRef.current.value = '';
        onSelect(null);
        onRemove();
    };

    const message = localError ?? error;
    const isAvatar = shape === 'avatar';

    return (
        /* A row by default. Stacking on a phone spent ~450px of screen on one
           optional field, so the second photo was always below the fold. */
        <div className={cn('flex items-start gap-3 sm:gap-4', layout === 'column' && 'sm:flex-col sm:gap-3')}>
            {/* Preview */}
            <div
                className={cn(
                    'bg-surface-muted border-border relative shrink-0 overflow-hidden border',
                    isAvatar ? 'size-20 rounded-full sm:size-24' : 'h-28 w-20 rounded-xl sm:h-40 sm:w-32',
                )}
            >
                {shown ? (
                    <img src={shown} alt="" className="size-full object-cover" />
                ) : (
                    <div className="text-muted flex size-full items-center justify-center">
                        {isAvatar ? (
                            <span className="text-h2 font-semibold">{fallback || <Camera className="size-6" />}</span>
                        ) : (
                            <ImageUp className="size-7" />
                        )}
                    </div>
                )}
            </div>

            <div className={cn('min-w-0 flex-1', layout === 'column' && 'sm:w-full sm:flex-none')}>
                <p className="text-label text-foreground font-medium">
                    {label} <span className="text-muted font-normal">(optional)</span>
                </p>
                {hint && <p className="text-meta text-muted mt-1">{hint}</p>}

                <input
                    ref={inputRef}
                    id={inputId}
                    type="file"
                    accept={ACCEPTED.join(',')}
                    className="sr-only"
                    onChange={(event) => pick(event.target.files?.[0] ?? null)}
                />

                <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                        <Camera className="size-4" />
                        {shown ? 'Change' : 'Upload'}
                    </Button>
                    {shown && (
                        <Button type="button" variant="ghost" size="sm" onClick={clear}>
                            <Trash2 className="size-4" />
                            Remove
                        </Button>
                    )}
                </div>

                <p className="text-meta text-muted mt-2">JPG, PNG or WebP. Up to 4MB.</p>
                {message && (
                    <p role="alert" className="text-meta text-danger mt-1.5">
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}
