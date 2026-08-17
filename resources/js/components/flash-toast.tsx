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
        <div className="bg-background fixed top-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border p-4 text-sm shadow-lg">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <div>
                <p className="text-foreground font-semibold">CourtPrime updated</p>
                <p className="text-muted-foreground mt-1">{flash.success}</p>
            </div>
        </div>
    );
}
