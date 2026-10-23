import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-ring font-mono',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-ink',
        secondary: 'border-transparent bg-secondary text-ink',
        outline: 'border border-border text-foreground',
        accent: 'border-transparent bg-text-accent text-ink',
        coral: 'border-transparent bg-text-coral text-ink font-bold',
        dark: 'border border-border bg-surface-dark text-text-secondary'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
