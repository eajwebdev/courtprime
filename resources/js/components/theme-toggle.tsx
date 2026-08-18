import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAppearance, type Appearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { Check, Monitor, Moon, Sun } from 'lucide-react';

const OPTIONS: { value: Appearance; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
];

/**
 * Light / dark / system switch for any surface.
 *
 * The existing appearance dropdown only styles for light chrome, so it is
 * invisible on the navy marketing nav. `tone="onDeep"` gives the trigger the
 * translucent treatment those bands use; everything else shares one control so
 * the two cannot drift.
 *
 * Defaults to `system`, which is why a visitor whose OS prefers dark lands on
 * the dark palette without ever choosing it.
 */
export function ThemeToggle({ tone = 'default', className }: { tone?: 'default' | 'onDeep'; className?: string }) {
    const { appearance, updateAppearance } = useAppearance();
    const Current = OPTIONS.find((option) => option.value === appearance)?.icon ?? Monitor;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label={`Theme: ${appearance}`}
                className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors',
                    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden',
                    tone === 'onDeep'
                        ? 'border-white/15 bg-white/10 text-white hover:bg-white/20'
                        : 'border-border bg-surface text-muted hover:text-foreground hover:border-border-strong',
                    className,
                )}
            >
                <Current className="size-4" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-40">
                {OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const active = option.value === appearance;

                    return (
                        <DropdownMenuItem key={option.value} onClick={() => updateAppearance(option.value)} className="gap-2">
                            <Icon className="size-4 shrink-0" aria-hidden />
                            <span className="flex-1">{option.label}</span>
                            {/* Selection is stated, not implied by highlight alone. */}
                            {active && <Check className="text-primary size-3.5 shrink-0" aria-hidden />}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
