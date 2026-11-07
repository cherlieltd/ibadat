"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthDays } from "@/lib/dates";
import type { DailyRecord } from "@/lib/types";
import { summarizeDay } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";

const WEEKDAYS_BN = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthCalendar({
  records,
  selectedDate,
  onSelect,
}: {
  records: DailyRecord[];
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const { locale, t } = useLocale();
  const initial = selectedDate.split("-").map(Number);
  const [year, setYear] = useState(initial[0]);
  const [month, setMonth] = useState(initial[1] - 1);

  const map = useMemo(
    () => new Map(records.map((r) => [r.record_date, r])),
    [records],
  );

  const days = monthDays(year, month);
  const firstWeekday = new Date(year, month, 1).getDay();
  const blanks = Array.from({ length: firstWeekday });

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  const title = new Date(year, month, 1).toLocaleDateString(
    locale === "bn" ? "bn-BD" : "en-GB",
    { month: "long", year: "numeric" },
  );

  const weekdays = locale === "bn" ? WEEKDAYS_BN : WEEKDAYS_EN;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => shiftMonth(-1)} aria-label="Previous month">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-lg font-semibold text-emerald-950 dark:text-emerald-50">{title}</h3>
        <Button variant="ghost" size="icon" onClick={() => shiftMonth(1)} aria-label="Next month">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-emerald-800/60 dark:text-emerald-200/60">
        {weekdays.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {blanks.map((_, i) => (
          <div key={`b-${i}`} />
        ))}
        {days.map((date) => {
          const summary = summarizeDay(map.get(date) ?? null, date);
          const selected = date === selectedDate;
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-2xl border text-sm font-semibold transition",
                selected && "ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-emerald-950",
                summary.status === "complete" && "border-emerald-500 bg-emerald-500 text-white",
                summary.status === "partial" && "border-amber-300 bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
                summary.status === "missed" && "border-rose-400 bg-rose-500 text-white",
                summary.status === "empty" && "border-emerald-100 bg-white/70 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
              )}
            >
              {Number(date.slice(-2))}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-emerald-800/70 dark:text-emerald-200/70 sm:grid-cols-4">
        <LegendDot color="bg-emerald-500" label={t("allComplete")} />
        <LegendDot color="bg-amber-300" label={t("partial")} />
        <LegendDot color="bg-rose-500" label={t("missed")} />
        <LegendDot color="bg-slate-300" label={t("emptyDay")} />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-3 w-3 rounded-full", color)} />
      {label}
    </div>
  );
}
