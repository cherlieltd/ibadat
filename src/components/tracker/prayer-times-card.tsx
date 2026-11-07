"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";
import {
  BOGURA,
  getBoguraPrayerTimes,
  getNextPrayer,
  PRAYER_ORDER,
  prayerLabel,
  type PrayerTimings,
} from "@/lib/prayer-times";
import { cn } from "@/lib/utils";

export function PrayerTimesCard() {
  const { locale, t } = useLocale();
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    void getBoguraPrayerTimes()
      .then((data) => {
        if (active) setTimings(data);
      })
      .catch(() => {
        if (active) setError(t("errorGeneric"));
      });
    const tick = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      active = false;
      window.clearInterval(tick);
    };
  }, [t]);

  const next = timings ? getNextPrayer(timings, new Date(now)) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4 text-amber-600" />
          {locale === "bn" ? "আজকের নামাজের সময় · বগুড়া" : "Today's prayer times · Bogura"}
        </CardTitle>
        <p className="text-xs text-emerald-800/60 dark:text-emerald-200/60">
          {BOGURA.timezone}
          {next
            ? ` · ${locale === "bn" ? "পরবর্তী" : "Next"}: ${prayerLabel(next.key, locale)} ${next.time}`
            : ""}
        </p>
      </CardHeader>
      <CardContent>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {!timings && !error ? (
          <div className="h-16 animate-pulse rounded-2xl bg-emerald-50 dark:bg-emerald-900/40" />
        ) : null}
        {timings ? (
          <div className="grid grid-cols-5 gap-2">
            {PRAYER_ORDER.map((key) => {
              const active = next?.key === key;
              return (
                <div
                  key={key}
                  className={cn(
                    "rounded-2xl px-1.5 py-2 text-center",
                    active
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-50",
                  )}
                >
                  <p className="text-[10px] font-medium opacity-80">
                    {prayerLabel(key, locale)}
                  </p>
                  <p className="mt-1 text-sm font-bold tabular-nums">{timings[key]}</p>
                </div>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
