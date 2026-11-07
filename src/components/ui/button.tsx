import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-700 text-white shadow-md shadow-emerald-900/10 hover:bg-emerald-800",
        secondary:
          "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-50",
        outline:
          "border border-emerald-200/80 bg-white/70 text-emerald-900 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-50",
        ghost: "hover:bg-emerald-50 text-emerald-900 dark:hover:bg-emerald-950/40",
        gold: "bg-gradient-to-br from-amber-400 to-amber-500 text-emerald-950 shadow-md shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400",
        danger: "bg-rose-600 text-white hover:bg-rose-700",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-xl px-3",
        lg: "h-12 rounded-2xl px-6 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
