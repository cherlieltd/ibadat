"use client";

import { AuthGate } from "@/components/layout/auth-gate";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { PrayerCard } from "@/components/tracker/prayer-card";
import { DateHeader } from "@/components/tracker/date-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrackedRecords } from "@/hooks/use-records";
import { QURAN_TARGET_MINUTES } from "@/lib/constants";
import { formatShortDate, shiftDateKey, todayKey } from "@/lib/dates";

export default function QuranPage() {
  return (
    <AuthGate roles={["wife"]}>
      <QuranContent />
    </AuthGate>
  );
}

function QuranContent() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { today, todayRecord, records, canWrite, save, loading } =
    useTrackedRecords(user);

  const history = records.slice(0, 14);
  const monthRecords = records.filter((r) =>
    r.record_date.startsWith(today.slice(0, 7)),
  );
  const monthYes = monthRecords.filter((r) => r.quran_status === "yes").length;
  const monthMinutes = monthRecords.reduce(
    (sum, r) => sum + (r.quran_minutes ?? 0),
    0,
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-emerald-950 dark:text-emerald-50">
            {t("quran")}
          </h1>
          <DateHeader date={today} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-emerald-800/70">{t("monthly")}</p>
              <p className="mt-1 text-2xl font-bold text-emerald-800">{monthYes}</p>
              <p className="text-xs text-emerald-800/60">{t("completedOf")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-emerald-800/70">{t("minutes")}</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">{monthMinutes}</p>
              <p className="text-xs text-emerald-800/60">{t("quranTarget")}</p>
            </CardContent>
          </Card>
        </div>

        {loading || !todayRecord ? (
          <div className="flex justify-center py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
          </div>
        ) : (
          <PrayerCard
            prayerKey="quran"
            record={todayRecord}
            canWrite={canWrite}
            onSave={(patch) => save(today, patch)}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t("history")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-emerald-800/70">{t("noRecords")}</p>
            ) : (
              history.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-2xl border border-emerald-100/80 bg-white/60 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40"
                >
                  <div>
                    <p className="font-medium">
                      {formatShortDate(record.record_date, locale)}
                    </p>
                    <p className="text-xs text-emerald-800/60">
                      {record.quran_status === "yes"
                        ? t("yes")
                        : record.quran_status === "no"
                          ? t("no")
                          : t("unanswered")}
                    </p>
                  </div>
                  <div className="text-right text-sm font-semibold text-amber-700">
                    {record.quran_minutes ?? 0}/{QURAN_TARGET_MINUTES}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <ConsistencyStrip />
      </div>
    </AppShell>
  );
}

function ConsistencyStrip() {
  const { user } = useAuth();
  const { records } = useTrackedRecords(user);
  const today = todayKey();
  const days = Array.from({ length: 14 }, (_, i) => shiftDateKey(today, -i)).reverse();
  const map = new Map(records.map((r) => [r.record_date, r]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>14-day Quran</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {days.map((date) => {
            const status = map.get(date)?.quran_status ?? "unanswered";
            const color =
              status === "yes"
                ? "bg-emerald-500"
                : status === "no"
                  ? "bg-rose-400"
                  : "bg-slate-300";
            return (
              <div
                key={date}
                title={date}
                className={`h-8 w-3 shrink-0 rounded-full ${color}`}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
