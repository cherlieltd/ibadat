"use client";

import { formatGregorian, toHijri } from "@/lib/dates";
import { useLocale } from "@/components/providers/locale-provider";

export function DateHeader({ date }: { date: string }) {
  const { locale, t } = useLocale();
  const hijri = toHijri(date);

  return (
    <div className="space-y-1 text-center sm:text-left">
      <p className="text-sm font-medium text-emerald-800/70 dark:text-emerald-200/70">
        {t("gregorian")}
      </p>
      <h2 className="text-xl font-semibold text-emerald-950 dark:text-emerald-50">
        {formatGregorian(date, locale)}
      </h2>
      <p className="text-sm text-amber-700 dark:text-amber-300">
        {locale === "bn" ? hijri.formattedBn : hijri.formattedEn}
      </p>
    </div>
  );
}
