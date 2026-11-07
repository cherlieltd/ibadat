"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { AuthGate } from "@/components/layout/auth-gate";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { DateHeader } from "@/components/tracker/date-header";
import { ProgressRing } from "@/components/tracker/progress-ring";
import { PrayerCard } from "@/components/tracker/prayer-card";
import { PrayerTimesCard } from "@/components/tracker/prayer-times-card";
import { Card, CardContent } from "@/components/ui/card";
import { useTrackedRecords } from "@/hooks/use-records";
import { MOTIVATIONAL_MESSAGES, PRAYERS } from "@/lib/constants";
import { summarizeDay } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <AuthGate roles={["wife"]}>
      <DashboardContent />
    </AuthGate>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const {
    today,
    todayRecord,
    loading,
    saving,
    savedFlash,
    canWrite,
    save,
  } = useTrackedRecords(user);

  const summary = summarizeDay(todayRecord, today);
  const message = useMemo(() => {
    const list = MOTIVATIONAL_MESSAGES[locale];
    const day = Number(today.slice(-2));
    return list[day % list.length];
  }, [locale, today]);

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <p className="text-lg text-emerald-800 dark:text-emerald-100">{t("greeting")}</p>
          <h1 className="font-display text-3xl text-emerald-950 dark:text-emerald-50">
            {t("todayTracker")}
          </h1>
          <DateHeader date={today} />
        </motion.div>

        <PrayerTimesCard />

        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-between">
            <div className="space-y-2 text-center sm:text-left">
              <p className="text-sm font-medium text-emerald-800/70 dark:text-emerald-200/70">
                {t("todayProgress")}
              </p>
              <p className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">
                {summary.completed}/6 {t("completedOf")}
              </p>
              <p className="max-w-xs text-sm leading-relaxed text-emerald-800/75 dark:text-emerald-200/75">
                {message}
              </p>
              <div className="flex items-center justify-center gap-2 text-xs sm:justify-start">
                {saving ? (
                  <span className="text-amber-700">{t("saving")}</span>
                ) : savedFlash ? (
                  <span className="text-emerald-700">{t("saved")}</span>
                ) : (
                  <span className="text-emerald-700/60">Asia/Dhaka</span>
                )}
              </div>
            </div>
            <ProgressRing
              value={summary.percentage}
              label={`${summary.percentage}%`}
              sublabel={`${summary.completed}/6`}
            />
          </CardContent>
        </Card>

        {loading || !todayRecord ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
          </div>
        ) : (
          <div className="space-y-4">
            {PRAYERS.map((prayer, index) => (
              <motion.div
                key={prayer.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <PrayerCard
                  prayerKey={prayer.key}
                  record={todayRecord}
                  canWrite={canWrite}
                  onSave={(patch) => save(today, patch)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
