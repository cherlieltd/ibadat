"use client";

import { AuthGate } from "@/components/layout/auth-gate";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import {
  MonthlyChart,
  StatsOverview,
  WeeklyChart,
} from "@/components/charts/completion-charts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTrackedRecords } from "@/hooks/use-records";
import { downloadCsv, streakFromRecords, summarizeDay } from "@/lib/utils";
import { PRAYERS } from "@/lib/constants";

export default function StatisticsPage() {
  return (
    <AuthGate roles={["wife"]}>
      <StatisticsContent />
    </AuthGate>
  );
}

function StatisticsContent() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { records, loading } = useTrackedRecords(user);
  const streak = streakFromRecords(records);
  const completeDays = records.filter((r) => summarizeDay(r, r.record_date).allYes).length;

  function exportCsv() {
    const rows = [
      [
        "date",
        ...PRAYERS.map((p) => p.key),
        "quran_minutes",
        "updated_at",
      ],
      ...records.map((r) => [
        r.record_date,
        r.fajr_status,
        r.dhuhr_status,
        r.asr_status,
        r.maghrib_status,
        r.isha_status,
        r.quran_status,
        String(r.quran_minutes ?? ""),
        r.updated_at,
      ]),
    ];
    downloadCsv("ibadat-history.csv", rows);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-emerald-950 dark:text-emerald-50">
              {t("statistics")}
            </h1>
            <p className="mt-1 text-sm text-emerald-800/70 dark:text-emerald-200/70">
              {t("weekly")} · {t("monthly")}
            </p>
          </div>
          <Button variant="outline" onClick={exportCsv}>
            {t("exportCsv")}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-emerald-800/70">{t("streak")}</p>
                  <p className="mt-1 text-3xl font-bold text-emerald-700">{streak}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-emerald-800/70">{t("allComplete")}</p>
                  <p className="mt-1 text-3xl font-bold text-amber-700">{completeDays}</p>
                </CardContent>
              </Card>
            </div>

            <StatsOverview records={records} />
            <WeeklyChart records={records} />
            <MonthlyChart records={records} />
          </>
        )}
      </div>
    </AppShell>
  );
}
