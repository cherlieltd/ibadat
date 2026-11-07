import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-12 w-full rounded-2xl border border-emerald-200/80 bg-white/90 px-4 text-base text-emerald-950 shadow-sm outline-none transition placeholder:text-emerald-800/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";
