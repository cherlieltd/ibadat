"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, CheckCircle2 } from "lucide-react";
import { PRAYERS, QURAN_TARGET_MINUTES } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";
import type { ActivityStatus, DailyRecord, PrayerKey } from "@/lib/types";
import { ACTIVITY_FIELDS } from "@/lib/types";
import { useLocale } from "@/components/providers/locale-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PrayerCardProps {
  prayerKey: PrayerKey;
  record: DailyRecord;
  canWrite: boolean;
  onSave: (patch: Partial<DailyRecord>) => Promise<unknown>;
}

export function PrayerCard({ prayerKey, record, canWrite, onSave }: PrayerCardProps) {
  const { t, locale } = useLocale();
  const meta = PRAYERS.find((p) => p.key === prayerKey)!;
  const statusField = ACTIVITY_FIELDS[prayerKey].status;
  const notesField = ACTIVITY_FIELDS[prayerKey].notes;
  const status = record[statusField] as ActivityStatus;
  const notes = (record[notesField] as string | null) ?? "";
  const minutesValue = record.quran_minutes?.toString() ?? "";

  const [localNotes, setLocalNotes] = useState(notes);
  const [notesSource, setNotesSource] = useState(notes);
  const [minutes, setMinutes] = useState(minutesValue);
  const [minutesSource, setMinutesSource] = useState(minutesValue);
  const [busy, setBusy] = useState<"yes" | "no" | "notes" | "minutes" | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  if (notes !== notesSource) {
    setNotesSource(notes);
    setLocalNotes(notes);
  }
  if (minutesValue !== minutesSource) {
    setMinutesSource(minutesValue);
    setMinutes(minutesValue);
  }

  async function selectStatus(next: ActivityStatus) {
    if (!canWrite || busy) return;
    const value = status === next ? "unanswered" : next;
    setBusy(value === "yes" ? "yes" : value === "no" ? "no" : null);
    try {
      await onSave({ [statusField]: value } as Partial<DailyRecord>);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 900);
    } finally {
      setBusy(null);
    }
  }

  async function persistNotes() {
    if (!canWrite || localNotes === notes) return;
    setBusy("notes");
    try {
      await onSave({ [notesField]: localNotes || null } as Partial<DailyRecord>);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 900);
    } finally {
      setBusy(null);
    }
  }

  async function persistMinutes() {
    if (!canWrite || prayerKey !== "quran") return;
    const parsed = minutes.trim() === "" ? null : Number(minutes);
    if (parsed !== null && (Number.isNaN(parsed) || parsed < 0)) return;
    if (parsed === record.quran_minutes) return;
    setBusy("minutes");
    try {
      await onSave({ quran_minutes: parsed });
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 900);
    } finally {
      setBusy(null);
    }
  }

  const quranProgress =
    prayerKey === "quran" && record.quran_minutes
      ? Math.min(100, Math.round((record.quran_minutes / QURAN_TARGET_MINUTES) * 100))
      : 0;

  return (
    <Card className={cn("overflow-hidden bg-gradient-to-br", meta.accent)}>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-sm dark:bg-emerald-950/60">
              {meta.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-950 dark:text-emerald-50">
                {locale === "bn" ? meta.nameBn : meta.nameEn}
              </h3>
              <p className="text-sm text-emerald-800/70 dark:text-emerald-200/70">
                {locale === "bn" ? meta.nameEn : meta.nameBn}
                {prayerKey === "quran" ? ` · ${t("quranTarget")}` : null}
              </p>
            </div>
          </div>
          <AnimatePresence>
            {justSaved ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("saved")}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={!canWrite || busy !== null}
            onClick={() => void selectStatus("yes")}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-3 py-3 text-sm font-semibold transition active:scale-[0.98]",
              status === "yes"
                ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-700/20"
                : "border-emerald-200/80 bg-white/80 text-emerald-900 hover:border-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-50",
            )}
            aria-pressed={status === "yes"}
          >
            {busy === "yes" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Check className="h-5 w-5" />
            )}
            <span>✅ {t("yes")}</span>
          </button>
          <button
            type="button"
            disabled={!canWrite || busy !== null}
            onClick={() => void selectStatus("no")}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-3 py-3 text-sm font-semibold transition active:scale-[0.98]",
              status === "no"
                ? "border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-600/20"
                : "border-emerald-200/80 bg-white/80 text-emerald-900 hover:border-rose-300 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-50",
            )}
            aria-pressed={status === "no"}
          >
            {busy === "no" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <X className="h-5 w-5" />
            )}
            <span>❌ {t("no")}</span>
          </button>
        </div>

        {prayerKey === "quran" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
              {t("actualMinutes")}
            </label>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              disabled={!canWrite}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              onBlur={() => void persistMinutes()}
              placeholder="0"
            />
            {record.quran_minutes ? (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-emerald-800/70 dark:text-emerald-200/70">
                  <span>{t("progressTowardTarget")}</span>
                  <span>
                    {record.quran_minutes}/{QURAN_TARGET_MINUTES} {t("minutes")}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${quranProgress}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
            {t("notes")}
          </label>
          <textarea
            disabled={!canWrite}
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={() => void persistNotes()}
            placeholder={t("notesPlaceholder")}
            className="min-h-20 w-full resize-none rounded-2xl border border-emerald-200/80 bg-white/90 px-4 py-3 text-sm text-emerald-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-50"
          />
        </div>

        <p className="text-xs text-emerald-800/60 dark:text-emerald-200/60">
          {t("lastUpdated")}: {formatRelativeTime(record.updated_at, locale)}
        </p>
      </CardContent>
    </Card>
  );
}
