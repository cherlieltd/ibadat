"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Radio } from "lucide-react";
import { AuthGate } from "@/components/layout/auth-gate";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { DateHeader } from "@/components/tracker/date-header";
import { ProgressRing } from "@/components/tracker/progress-ring";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTrackedRecords } from "@/hooks/use-records";
import { PRAYERS } from "@/lib/constants";
import { getActivityStatus, summarizeDay } from "@/lib/utils";
import { WeeklyChart } from "@/components/charts/completion-charts";

export default function AdminPage() {
  return (
    <AuthGate roles={["husband"]}>
      <AdminContent />
    </AuthGate>
  );
}

function AdminContent() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { today, todayRecord, records, loading, savedFlash } = useTrackedRecords(user);
  const summary = summarizeDay(todayRecord, today);

  return (
    <AppShell wide>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-800/70 dark:text-emerald-200/70">
              {t("readOnly")}
            </p>
            <h1 className="font-display text-3xl text-emerald-950 dark:text-emerald-50 md:text-4xl">
              {t("adminTitle")}
            </h1>
            <DateHeader date={today} />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100">
            <Radio className={`h-3.5 w-3.5 ${savedFlash ? "text-amber-500" : "text-emerald-500"}`} />
            {t("liveUpdates")}
          </div>
        </div>

        {loading || !todayRecord ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
              <Card>
                <CardContent className="flex flex-col items-center gap-3 p-6">
                  <ProgressRing
                    value={summary.percentage}
                    label={`${summary.percentage}%`}
                    sublabel={`${summary.completed}/6`}
                  />
                  <p className="text-center text-sm text-emerald-800/70 dark:text-emerald-200/70">
                    {t("wifeProgress")}
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {PRAYERS.map((prayer, index) => {
                  const status = getActivityStatus(todayRecord, prayer.key);
                  return (
                    <motion.div
                      key={prayer.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <Card>
                        <CardContent className="flex items-center justify-between gap-3 p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{prayer.icon}</span>
                            <div>
                              <p className="font-semibold">
                                {locale === "bn" ? prayer.nameBn : prayer.nameEn}
                              </p>
                              <p className="text-xs text-emerald-800/60">
                                {status === "yes"
                                  ? t("yes")
                                  : status === "no"
                                    ? t("no")
                                    : t("unanswered")}
                              </p>
                            </div>
                          </div>
                          <StatusPill status={status} />
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <WeeklyChart records={records} />

            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild variant="secondary" size="lg" className="justify-between">
                <Link href="/admin/history">
                  <span className="inline-flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    {t("viewHistory")}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="justify-between">
                <Link href="/admin/reports">
                  {t("viewReports")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatusPill({ status }: { status: "yes" | "no" | "unanswered" }) {
  const styles =
    status === "yes"
      ? "bg-emerald-100 text-emerald-800"
      : status === "no"
        ? "bg-rose-100 text-rose-700"
        : "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>{status}</span>;
}
