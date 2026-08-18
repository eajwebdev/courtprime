import { ThemeToggle } from '@/components/theme-toggle';
import { HTMLAttributes } from 'react';

/**
 * @deprecated Use `ThemeToggle` directly.
 *
 * Kept as a thin alias so existing imports keep working. The three-state
 * dropdown it used to render is gone: there is no "system" mode any more, so a
 * menu for two options was a menu too many.
 */
export default function AppearanceToggleDropdown({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={className} {...props}>
            <ThemeToggle />
        </div>
    );
}
