import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { type ReactNode, useState } from 'react';

type ConfirmDialogProps = {
    trigger: ReactNode;
    title: string;
    description: string;
    confirmLabel?: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => void;
};

export function ConfirmDialog({ trigger, title, description, confirmLabel = 'Confirm', variant = 'default', onConfirm }: ConfirmDialogProps) {
    const [open, setOpen] = useState(false);

    const confirm = () => {
        onConfirm();
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
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
