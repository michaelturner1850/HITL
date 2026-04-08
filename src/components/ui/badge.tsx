import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-slate-100 text-slate-800",
        secondary: "border-transparent bg-slate-200 text-slate-800",
        outline: "border-slate-300 text-slate-700",
        success: "border-transparent bg-emerald-100 text-emerald-900",
        warning: "border-transparent bg-amber-100 text-amber-950",
        danger: "border-transparent bg-red-100 text-red-900",
        info: "border-transparent bg-sky-100 text-sky-950",
        muted: "border-transparent bg-slate-50 text-slate-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
