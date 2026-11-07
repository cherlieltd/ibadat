"use client";

import { useEffect, useState } from "react";
import { AuthGate } from "@/components/layout/auth-gate";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { MonthCalendar } from "@/components/tracker/month-calendar";
import { PrayerCard } from "@/components/tracker/prayer-card";
import { DateHeader } from "@/components/tracker/date-header";
import { Card, CardContent } from "@/components/ui/card";
import { useTrackedRecords } from "@/hooks/use-records";
import { PRAYERS } from "@/lib/constants";
import type { DailyRecord } from "@/lib/types";
import { summarizeDay } from "@/lib/utils";

export default function CalendarPage() {
  return (
    <AuthGate roles={["wife"]}>
      <CalendarContent />
    </AuthGate>
  );
}

function CalendarContent() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { today, records, canWrite, save, getRecordForDate, loading } =
    useTrackedRecords(user);
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
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-emerald-950 dark:text-emerald-50">
            {t("calendar")}
          </h1>
          <p className="mt-1 text-sm text-emerald-800/70 dark:text-emerald-200/70">
            {t("selectDate")}
          </p>
        </div>

        <Card>
          <CardContent className="p-5">
            <MonthCalendar
              records={records}
              selectedDate={selected}
              onSelect={setSelected}
            />
          </CardContent>
        </Card>

        <DateHeader date={selected} />
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-100">
          {summary.completed}/6 {t("completedOf")} · {summary.percentage}%
        </p>

        {loading || !record ? (
          <div className="flex justify-center py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
          </div>
        ) : (
          <div className="space-y-4">
            {PRAYERS.map((prayer) => (
              <PrayerCard
                key={prayer.key}
                prayerKey={prayer.key}
                record={record}
                canWrite={canWrite}
                onSave={async (patch) => {
                  const updated = await save(selected, patch);
                  if (updated) setRecord(updated);
                  return updated;
                }}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
