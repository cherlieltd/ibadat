"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { scheduleBoguraPrayerNotifications } from "@/lib/notifications";

export function PrayerNotificationManager() {
  const { user } = useAuth();
  const { locale } = useLocale();

  useEffect(() => {
    if (!user || user.profile.role !== "wife") return;

    const prayerEnabled = user.profile.reminder_enabled;
    const quranEnabled = user.profile.quran_reminder_enabled;
    if (!prayerEnabled && !quranEnabled) return;

    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      void scheduleBoguraPrayerNotifications({
        locale,
        prayerEnabled,
        quranEnabled,
      }).catch(() => {
        // Network / permission failures are non-fatal
      });
    };

    run();

    // Reschedule when tab becomes visible (helps after phone sleep)
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisible);

    // Refresh schedule around midnight Dhaka + periodically
    const interval = window.setInterval(run, 30 * 60 * 1000);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, [
    user,
    user?.profile.reminder_enabled,
    user?.profile.quran_reminder_enabled,
    locale,
  ]);

  return null;
}
