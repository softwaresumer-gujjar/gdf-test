import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive/10 text-destructive',
        outline: 'border border-border text-foreground',
        pending: 'bg-amber-50 text-amber-800',
        paid: 'bg-emerald-50 text-emerald-800',
        dispatched: 'bg-blue-50 text-blue-800',
        delivered: 'bg-green-50 text-green-900',
        cancelled: 'bg-red-50 text-red-900',
        active: 'bg-emerald-50 text-emerald-800',
        inactive: 'bg-muted text-muted-foreground',
        low: 'bg-amber-50 text-amber-800',
        out: 'bg-red-50 text-red-900',
        up: 'bg-emerald-50 text-emerald-700',
        down: 'bg-red-50 text-red-700',
        neutral: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
