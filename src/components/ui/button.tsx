import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-primary text-ink font-bold hover:bg-[#c27c3e] active:scale-[0.98]',
        secondary: 'bg-secondary text-ink font-semibold hover:bg-[#a28353] active:scale-[0.98]',
        outline: 'border border-border bg-transparent text-foreground hover:border-primary hover:text-primary active:scale-[0.98]',
        ghost: 'text-foreground hover:bg-surface-card hover:text-primary',
        accent: 'bg-text-accent text-ink font-bold hover:opacity-90',
        destructive: 'bg-text-coral text-ink font-bold hover:opacity-90',
        link: 'text-text-accent underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-10 px-4 py-2 rounded-[5px]',
        sm: 'h-8 px-3 text-xs rounded-[4px]',
        lg: 'h-11 px-8 rounded-[6px] text-base',
        icon: 'h-10 w-10 rounded-[5px]',
        circular: 'h-[74px] w-[74px] rounded-full text-base font-bold'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';
