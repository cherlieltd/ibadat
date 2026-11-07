"use client";

import { useEffect, useState } from "react";
import { AuthGate } from "@/components/layout/auth-gate";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { MonthCalendar } from "@/components/tracker/month-calendar";
import { DateHeader } from "@/components/tracker/date-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrackedRecords } from "@/hooks/use-records";
import { PRAYERS } from "@/lib/constants";
import type { DailyRecord } from "@/lib/types";
import { getActivityStatus, summarizeDay } from "@/lib/utils";

export default function AdminHistoryPage() {
  return (
    <AuthGate roles={["husband"]}>
      <HistoryContent />
    </AuthGate>
  );
}

function HistoryContent() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { today, records, getRecordForDate, loading } = useTrackedRecords(user);
  const [selected, setSelected] = useState(today);
  const [syncedToday, setSyncedToday] = useState(today);
  const [record, setRecord] = useState<DailyRecord | null>(null);

  if (today !== syncedToday) {
    setSyncedToday(today);
    setSelected(today);
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      const next = await getRecordForDate(selected);
      if (active) setRecord(next);
    })();
    return () => {
      active = false;
    };
  }, [selected, getRecordForDate, records]);

  const summary = summarizeDay(record, selected);

  return (
    <AppShell wide>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-emerald-950 dark:text-emerald-50">
            {t("history")}
          </h1>
          <p className="mt-1 text-sm text-emerald-800/70">{t("readOnly")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardContent className="p-5">
              <MonthCalendar
                records={records}
                selectedDate={selected}
                onSelect={setSelected}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <DateHeader date={selected} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium">
                {summary.completed}/6 · {summary.percentage}% · unanswered {summary.unansweredCount}
              </p>
              {loading || !record ? (
                <div className="flex justify-center py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
                </div>
              ) : (
                PRAYERS.map((prayer) => {
                  const status = getActivityStatus(record, prayer.key);
                  return (
                    <div
                      key={prayer.key}
                      className="flex items-center justify-between rounded-2xl border border-emerald-100/80 px-4 py-3 dark:border-emerald-900"
                    >
                      <div className="flex items-center gap-3">
                        <span>{prayer.icon}</span>
                        <span className="font-medium">
                          {locale === "bn" ? prayer.nameBn : prayer.nameEn}
                        </span>
                      </div>
                      <span className="text-sm capitalize">
                        {status === "yes"
                          ? t("yes")
                          : status === "no"
                            ? t("no")
                            : t("unanswered")}
                      </span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
