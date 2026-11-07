"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  className,
  wide = false,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 islamic-pattern opacity-40 dark:opacity-20" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-emerald-200/50 via-amber-50/40 to-transparent dark:from-emerald-950/80 dark:via-emerald-950/20" />
      <main
        className={cn(
          "mx-auto w-full px-4 pb-28 pt-6",
          wide ? "max-w-6xl" : "max-w-lg",
          className,
        )}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
