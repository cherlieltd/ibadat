"use client";

import { AuthGate } from "@/components/layout/auth-gate";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import {
  MonthlyChart,
  StatsOverview,
  WeeklyChart,
  totalCompletedActivities,
} from "@/components/charts/completion-charts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTrackedRecords } from "@/hooks/use-records";
import { downloadCsv, streakFromRecords, summarizeDay } from "@/lib/utils";
import { PRAYERS } from "@/lib/constants";

export default function AdminReportsPage() {
  return (
    <AuthGate roles={["husband"]}>
      <ReportsContent />
    </AuthGate>
  );
}

function ReportsContent() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { records, loading } = useTrackedRecords(user);
  const streak = streakFromRecords(records);
  const completeDays = records.filter((r) => summarizeDay(r, r.record_date).allYes).length;
  const total = totalCompletedActivities(records);

  function exportCsv() {
    const rows = [
      ["date", ...PRAYERS.map((p) => p.key), "quran_minutes", "updated_at"],
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
    downloadCsv("ibadat-admin-history.csv", rows);
  }

  return (
    <AppShell wide>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-emerald-950 dark:text-emerald-50">
              {t("reports")}
            </h1>
            <p className="mt-1 text-sm text-emerald-800/70">{t("readOnly")}</p>
          </div>
          <Button variant="outline" onClick={exportCsv}>
            {t("exportCsv")}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-emerald-800/70">{t("completedOf")}</p>
                  <p className="mt-1 text-3xl font-bold text-emerald-700">{total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-emerald-800/70">{t("streak")}</p>
                  <p className="mt-1 text-3xl font-bold text-amber-700">{streak}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-emerald-800/70">{t("allComplete")}</p>
                  <p className="mt-1 text-3xl font-bold text-emerald-800">{completeDays}</p>
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
