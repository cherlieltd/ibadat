"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyRecord } from "@/lib/types";
import { countCompleted, summarizeDay } from "@/lib/utils";
import { shiftDateKey, todayKey } from "@/lib/dates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";

function buildSeries(records: DailyRecord[], days: number) {
  const map = new Map(records.map((r) => [r.record_date, r]));
  const today = todayKey();
  return Array.from({ length: days }, (_, i) => {
    const date = shiftDateKey(today, -(days - 1 - i));
    const record = map.get(date);
    const summary = summarizeDay(record ?? null, date);
    return {
      date: date.slice(5),
      completed: summary.completed,
      percentage: summary.percentage,
      missed: record
        ? [
            record.fajr_status,
            record.dhuhr_status,
            record.asr_status,
            record.maghrib_status,
            record.isha_status,
            record.quran_status,
          ].filter((s) => s === "no").length
        : 0,
      unanswered: summary.unansweredCount,
      quranMinutes: record?.quran_minutes ?? 0,
      quranDone: record?.quran_status === "yes" ? 1 : 0,
    };
  });
}

export function WeeklyChart({ records }: { records: DailyRecord[] }) {
  const { t } = useLocale();
  const data = buildSeries(records, 7);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("weekly")}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 6]} allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="completed" name={t("completedOf")} fill="#059669" radius={[8, 8, 0, 0]} />
            <Bar dataKey="missed" name={t("missed")} fill="#f43f5e" radius={[8, 8, 0, 0]} />
            <Bar dataKey="unanswered" name={t("unanswered")} fill="#94a3b8" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function MonthlyChart({ records }: { records: DailyRecord[] }) {
  const { t } = useLocale();
  const data = buildSeries(records, 30);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("monthly")}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="percentage"
              name="%"
              stroke="#059669"
              strokeWidth={3}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="quranMinutes"
              name={t("minutes")}
              stroke="#D4A017"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function StatsOverview({ records }: { records: DailyRecord[] }) {
  const { t } = useLocale();
  const prayerKeys = [
    "fajr_status",
    "dhuhr_status",
    "asr_status",
    "maghrib_status",
    "isha_status",
  ] as const;

  let completedPrayers = 0;
  let missedPrayers = 0;
  let unanswered = 0;
  let quranYes = 0;

  for (const record of records) {
    completedPrayers += prayerKeys.filter((k) => record[k] === "yes").length;
    missedPrayers += prayerKeys.filter((k) => record[k] === "no").length;
    unanswered += [
      ...prayerKeys.map((k) => record[k]),
      record.quran_status,
    ].filter((s) => s === "unanswered").length;
    if (record.quran_status === "yes") quranYes += 1;
  }

  const items = [
    { label: t("completedOf"), value: completedPrayers, color: "text-emerald-700" },
    { label: t("missed"), value: missedPrayers, color: "text-rose-600" },
    { label: t("unanswered"), value: unanswered, color: "text-slate-500" },
    { label: t("quran"), value: quranYes, color: "text-amber-700" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <p className="text-xs text-emerald-800/70 dark:text-emerald-200/70">{item.label}</p>
            <p className={`mt-1 text-2xl font-bold ${item.color}`}>{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function totalCompletedActivities(records: DailyRecord[]) {
  return records.reduce((sum, r) => sum + countCompleted(r), 0);
}
