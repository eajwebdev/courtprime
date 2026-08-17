import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * CourtPrime button.
 *
 * `default` is the pink primary action, there is at most ONE per screen region.
 * Reach for `subtle` or `outline` for everything alongside it.
 */
const buttonVariants = cva(
    [
        'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md',
        'text-label font-medium',
        'transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'active:scale-[0.985]',
        'disabled:pointer-events-none disabled:opacity-50',
        '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    ].join(' '),
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground shadow-e1 hover:bg-primary-hover',
                secondary: 'bg-brand-blue text-brand-blue-foreground shadow-e1 hover:brightness-110',
                subtle: 'bg-surface-muted text-foreground hover:bg-border',
                outline: 'border border-border-strong bg-surface text-foreground hover:bg-surface-muted',
                ghost: 'text-secondary hover:bg-surface-muted hover:text-foreground',
                destructive: 'bg-danger text-primary-foreground shadow-e1 hover:brightness-110',
                link: 'text-primary underline-offset-4 hover:underline',
                /* For placement on navy / immersive surfaces. */
                onDeep: 'border border-white/15 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20',
            },
            size: {
                sm: 'h-9 px-3',
                default: 'h-10 px-4',
                lg: 'h-11 px-6',
                /* Front-desk and POS: 44px minimum touch target. */
                touch: 'h-12 px-6 text-body',
                icon: 'size-10',
                iconSm: 'size-9',
                iconTouch: 'size-12',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
