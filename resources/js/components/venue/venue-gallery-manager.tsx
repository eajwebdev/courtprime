import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { Check, ImagePlus, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';

export type ManagedPhoto = { id: number; url: string; caption?: string | null };

const ACCEPT = 'image/jpeg,image/png,image/webp';

/**
 * Gallery manager for a venue the signed-in club owns.
 *
 * Each tile edits in place: rename the label, swap the image, or remove it.
 * Editing inline rather than in a dialog means an owner can retitle four photos
 * without four round trips through a modal.
 */
export function VenueGalleryManager({ branchId, photos }: { branchId: number; photos: ManagedPhoto[] }) {
    const addInput = useRef<HTMLInputElement>(null);
    const add = useForm<{ photo: File | null; caption: string }>({ photo: null, caption: '' });

    const upload = (file: File | null) => {
        if (!file) return;

        add.setData('photo', file);
        add.post(`/branches/${branchId}/photos`, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                add.reset();
                if (addInput.current) addInput.current.value = '';
            },
        });
    };

    return (
        <div>
            <div className="flex items-baseline justify-between gap-3">
                <p className="text-label text-foreground font-medium">Gallery</p>
                <p className="text-meta text-muted">
                    <span data-numeric>{photos.length}</span> {photos.length === 1 ? 'photo' : 'photos'}
                </p>
            </div>

            <ul className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-3">
                {photos.map((photo) => (
                    <li key={photo.id}>
                        <PhotoTile branchId={branchId} photo={photo} />
                    </li>
                ))}

                <li>
                    <input
                        ref={addInput}
                        type="file"
                        accept={ACCEPT}
                        className="sr-only"
                        onChange={(event) => upload(event.target.files?.[0] ?? null)}
                    />
                    <button
                        type="button"
                        onClick={() => addInput.current?.click()}
                        disabled={add.processing}
                        className="border-border-strong text-muted hover:border-primary hover:text-primary flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed transition-colors disabled:opacity-60"
                    >
                        {add.processing ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
                        <span className="text-[0.6875rem] font-medium">{add.processing ? 'Uploading' : 'Add photo'}</span>
                    </button>
                </li>
            </ul>

            {add.errors.photo && (
                <p role="alert" className="text-meta text-danger mt-2">
                    {add.errors.photo}
                </p>
            )}
        </div>
    );
}

function PhotoTile({ branchId, photo }: { branchId: number; photo: ManagedPhoto }) {
    const replaceInput = useRef<HTMLInputElement>(null);
    const [editing, setEditing] = useState(false);

    const form = useForm<{ photo: File | null; caption: string }>({
        photo: null,
        caption: photo.caption ?? '',
    });

    const save = () => {
        form.post(`/branches/${branchId}/photos/${photo.id}`, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => setEditing(false),
        });
    };

    const replace = (file: File | null) => {
        if (!file) return;

        form.setData('photo', file);
        form.post(`/branches/${branchId}/photos/${photo.id}`, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => form.setData('photo', null),
        });
    };

    const remove = () => {
        form.delete(`/branches/${branchId}/photos/${photo.id}`, { preserveScroll: true });
    };

    return (
        <div className="border-border bg-surface overflow-hidden rounded-lg border">
            <div className="bg-surface-deep relative aspect-square">
                <img src={photo.url} alt={photo.caption ?? ''} loading="lazy" decoding="async" className="size-full object-contain" />

                {form.processing && (
                    <div className="bg-surface-deep/70 absolute inset-0 flex items-center justify-center">
                        <Loader2 className="size-5 animate-spin text-white" />
                    </div>
                )}

                {/* Actions sit on the image so the tile stays compact. */}
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                    <input
                        ref={replaceInput}
                        type="file"
                        accept={ACCEPT}
                        className="sr-only"
                        onChange={(event) => replace(event.target.files?.[0] ?? null)}
                    />
                    <TileAction label="Replace image" onClick={() => replaceInput.current?.click()}>
                        <ImagePlus className="size-3.5" />
                    </TileAction>
                    <TileAction label="Remove photo" onClick={remove} destructive>
                        <Trash2 className="size-3.5" />
                    </TileAction>
                </div>
            </div>

            <div className="p-2">
                {editing ? (
                    <div className="flex items-center gap-1">
                        <Input
                            value={form.data.caption}
                            onChange={(event) => form.setData('caption', event.target.value)}
                            onKeyDown={(event) => event.key === 'Enter' && save()}
                            placeholder="Label"
                            aria-label="Photo label"
                            autoFocus
                            className="text-meta h-8"
                        />
                        <Button type="button" size="iconSm" onClick={save} aria-label="Save label" disabled={form.processing}>
                            <Check className="size-3.5" />
                        </Button>
                        <Button
                            type="button"
                            size="iconSm"
                            variant="ghost"
                            aria-label="Cancel"
                            onClick={() => {
                                form.setData('caption', photo.caption ?? '');
                                setEditing(false);
                            }}
                        >
                            <X className="size-3.5" />
                        </Button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="hover:bg-surface-muted flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left transition-colors"
                    >
                        <span className={cn('text-meta min-w-0 flex-1 truncate', photo.caption ? 'text-foreground' : 'text-muted italic')}>
                            {photo.caption || 'Add a label'}
                        </span>
                        <Pencil className="text-muted size-3 shrink-0" aria-hidden />
                    </button>
                )}

                {form.errors.caption && <p className="text-meta text-danger mt-1">{form.errors.caption}</p>}
                {form.errors.photo && <p className="text-meta text-danger mt-1">{form.errors.photo}</p>}
            </div>
        </div>
    );
}

function TileAction({
    label,
    onClick,
    children,
    destructive,
}: {
    label: string;
    onClick: () => void;
    children: React.ReactNode;
    destructive?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            className={cn(
                'flex size-7 items-center justify-center rounded-md border border-white/20 bg-black/45 text-white backdrop-blur-sm transition-colors',
                destructive ? 'hover:bg-danger' : 'hover:bg-primary',
            )}
        >
            {children}
        </button>
    );
}
