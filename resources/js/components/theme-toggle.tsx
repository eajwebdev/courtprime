import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { Moon, Sun } from 'lucide-react';

/**
 * One button, two states. Click flips light and dark.
 *
 * `tone="onDeep"` is for navy chrome, where the default bordered treatment is
 * invisible.
 */
export function ThemeToggle({ tone = 'default', className }: { tone?: 'default' | 'onDeep'; className?: string }) {
    const { appearance, toggleAppearance } = useAppearance();
    const dark = appearance === 'dark';

    return (
        <button
            type="button"
            onClick={toggleAppearance}
            role="switch"
            aria-checked={dark}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden',
                tone === 'onDeep'
                    ? 'border-white/15 bg-white/10 text-white hover:bg-white/20'
                    : 'border-border bg-surface text-muted hover:text-foreground hover:border-border-strong',
                className,
            )}
        >
            {dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>
    );
}
