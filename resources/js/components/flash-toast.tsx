import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function FlashToast() {
    const { flash } = usePage<SharedData>().props as SharedData & { flash?: { success?: string | null } };
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!flash?.success) {
            return;
        }

        setVisible(true);
        const timer = window.setTimeout(() => setVisible(false), 4200);

        return () => window.clearTimeout(timer);
    }, [flash?.success]);

    if (!visible || !flash?.success) {
        return null;
    }

    return (
        /*
         * Bottom on a phone, above the tab bar and inside the thumb's line of
         * sight; top-right on a desktop where the eye is already. It used to sit
         * top-right everywhere, which on a phone is the one corner a player
         * holding a paddle never looks at.
         */
        <div
            role="status"
            aria-live="polite"
            className="border-border bg-surface-raised shadow-e3 z-toast fixed inset-x-4 bottom-24 flex items-start gap-3 rounded-xl border p-4 sm:inset-x-auto sm:top-4 sm:right-4 sm:bottom-auto sm:max-w-sm"
        >
            <CheckCircle2 className="text-success mt-0.5 size-5 shrink-0" />
            <p className="text-label text-foreground">{flash.success}</p>
        </div>
    );
}
