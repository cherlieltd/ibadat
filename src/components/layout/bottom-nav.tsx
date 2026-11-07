"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  BarChart3,
  Home,
  Settings,
  Shield,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLocale();

  if (!user) return null;

  const items =
    user.profile.role === "husband"
      ? [
          { href: "/admin", label: t("admin"), icon: Shield },
          { href: "/admin/history", label: t("history"), icon: CalendarDays },
          { href: "/admin/reports", label: t("reports"), icon: BarChart3 },
          { href: "/settings", label: t("settings"), icon: Settings },
        ]
      : [
          { href: "/dashboard", label: t("dashboard"), icon: Home },
          { href: "/calendar", label: t("calendar"), icon: CalendarDays },
          { href: "/quran", label: t("quran"), icon: BookOpen },
          { href: "/statistics", label: t("statistics"), icon: BarChart3 },
          { href: "/settings", label: t("settings"), icon: Settings },
        ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100/80 bg-white/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-emerald-900 dark:bg-emerald-950/90">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-1 py-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition",
                  active
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-100"
                    : "text-emerald-700/60 hover:text-emerald-800 dark:text-emerald-300/60",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "scale-110")} />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
