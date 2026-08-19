import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { type ReactNode, useState } from 'react';

type ConfirmDialogProps = {
    /** Renders its own trigger. Omit when the caller controls `open` itself. */
    trigger?: ReactNode;
    /** Controlled mode, for when the button that opens this lives elsewhere. */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => void;
};

export function ConfirmDialog({
    trigger,
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Confirm',
    variant = 'default',
    onConfirm,
}: ConfirmDialogProps) {
    const [uncontrolled, setUncontrolled] = useState(false);

    /* Controlled when the caller passes `open`, otherwise it keeps its own. */
    const isOpen = open ?? uncontrolled;
    const setOpen = onOpenChange ?? setUncontrolled;

    const confirm = () => {
        onConfirm();
        setOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="button" variant={variant} onClick={confirm}>
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
