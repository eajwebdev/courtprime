import { FlashToast } from '@/components/flash-toast';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useState } from 'react';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    const [isOpen, setIsOpen] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sidebar') !== 'false' : true));

    const handleSidebarChange = (open: boolean) => {
        setIsOpen(open);

        if (typeof window !== 'undefined') {
            localStorage.setItem('sidebar', String(open));
        }
    };

    if (variant === 'header') {
        return (
            <div className="flex min-h-screen w-full flex-col">
                <SkipLink />
                <FlashToast />
                {children}
            </div>
        );
    }

    return (
        <SidebarProvider defaultOpen={isOpen} open={isOpen} onOpenChange={handleSidebarChange}>
            <SkipLink />
            <FlashToast />
            {children}
        </SidebarProvider>
    );
}

function SkipLink() {
    return (
        <a
            href="#main-content"
            className="bg-background text-foreground focus:ring-ring sr-only fixed top-3 left-3 z-50 rounded-md px-3 py-2 text-sm font-semibold shadow focus:not-sr-only focus:ring-2 focus:outline-none"
        >
            Skip to main content
        </a>
    );
}
