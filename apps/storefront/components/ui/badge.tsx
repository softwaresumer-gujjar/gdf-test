import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-sans font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-accent text-accent-foreground border border-accent-foreground/20',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border border-border text-foreground',
        pill: 'bg-[#eef6ea] border border-[#d9e9d2] text-primary',
        pending: 'bg-amber-100 text-amber-800',
        paid: 'bg-emerald-100 text-emerald-800',
        dispatched: 'bg-blue-100 text-blue-800',
        delivered: 'bg-green-100 text-green-900',
        cancelled: 'bg-red-100 text-red-800',
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
