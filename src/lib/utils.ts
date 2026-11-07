import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ActivityStatus, DailyRecord, DaySummary, PrayerKey } from "./types";
import { STATUS_KEYS } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createEmptyRecord(
  userId: string,
  recordDate: string,
): DailyRecord {
  const now = new Date().toISOString();
  return {
    id: `local-${userId}-${recordDate}`,
    user_id: userId,
    record_date: recordDate,
    fajr_status: "unanswered",
    dhuhr_status: "unanswered",
    asr_status: "unanswered",
    maghrib_status: "unanswered",
    isha_status: "unanswered",
    quran_status: "unanswered",
    quran_minutes: null,
    notes: null,
    fajr_notes: null,
    dhuhr_notes: null,
    asr_notes: null,
    maghrib_notes: null,
    isha_notes: null,
    quran_notes: null,
    created_at: now,
    updated_at: now,
  };
}

export function getStatuses(record: DailyRecord): ActivityStatus[] {
  return STATUS_KEYS.map((key) => record[key] as ActivityStatus);
}

export function countCompleted(record: DailyRecord): number {
  return getStatuses(record).filter((status) => status === "yes").length;
}

export function summarizeDay(record: DailyRecord | null, date: string): DaySummary {
  if (!record) {
    return {
      date,
      completed: 0,
      total: 6,
      percentage: 0,
      allYes: false,
      allNo: false,
      unansweredCount: 6,
      status: "empty",
    };
  }

  const statuses = getStatuses(record);
  const completed = statuses.filter((s) => s === "yes").length;
  const noCount = statuses.filter((s) => s === "no").length;
  const unansweredCount = statuses.filter((s) => s === "unanswered").length;
  const allYes = completed === 6;
  const allNo = noCount === 6;
  const answered = completed + noCount;

  let status: DaySummary["status"] = "empty";
  if (allYes) status = "complete";
  else if (allNo) status = "missed";
  else if (answered > 0) status = "partial";
  else status = "empty";

  return {
    date,
    completed,
    total: 6,
    percentage: Math.round((completed / 6) * 100),
    allYes,
    allNo,
    unansweredCount,
    status,
  };
}

export function getActivityStatus(
  record: DailyRecord,
  key: PrayerKey,
): ActivityStatus {
  const map: Record<PrayerKey, ActivityStatus> = {
    fajr: record.fajr_status,
    dhuhr: record.dhuhr_status,
    asr: record.asr_status,
    maghrib: record.maghrib_status,
    isha: record.isha_status,
    quran: record.quran_status,
  };
  return map[key];
}

export function formatRelativeTime(iso: string, locale: "bn" | "en"): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return locale === "bn" ? "এইমাত্র" : "Just now";
  if (minutes < 60) {
    return locale === "bn" ? `${minutes} মিনিট আগে` : `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return locale === "bn" ? `${hours} ঘণ্টা আগে` : `${hours}h ago`;
  }

  return date.toLocaleString(locale === "bn" ? "bn-BD" : "en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });
}

export function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function streakFromRecords(records: DailyRecord[]): number {
  const byDate = new Map(records.map((r) => [r.record_date, r]));
  let streak = 0;
  // Importing todayKey/shiftDateKey lazily via dynamic require would be messy;
  // callers pass Dhaka-keyed dates already, so walk backward from local ISO date strings.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  let cursor = today;
  while (true) {
    const record = byDate.get(cursor);
    if (!record || !summarizeDay(record, cursor).allYes) break;
    streak += 1;
    const [y, m, d] = cursor.split("-").map(Number);
    const prev = new Date(Date.UTC(y, m - 1, d - 1));
    cursor = prev.toISOString().slice(0, 10);
  }

  return streak;
}
