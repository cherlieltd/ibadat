import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { addDays, format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

export const APP_TIMEZONE = "Asia/Dhaka";

export function nowInDhaka(): Date {
  return toZonedTime(new Date(), APP_TIMEZONE);
}

export function todayKey(date: Date = new Date()): string {
  return formatInTimeZone(date, APP_TIMEZONE, "yyyy-MM-dd");
}

export function formatGregorian(
  dateKey: string,
  locale: "bn" | "en" = "bn",
): string {
  const date = parseISO(dateKey);
  return date.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: APP_TIMEZONE,
  });
}

export function formatShortDate(
  dateKey: string,
  locale: "bn" | "en" = "bn",
): string {
  const date = parseISO(dateKey);
  return date.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: APP_TIMEZONE,
  });
}

/** Kuwaiti algorithm for Gregorian → Hijri conversion */
export function toHijri(dateKey: string): {
  day: number;
  month: number;
  year: number;
  monthNameBn: string;
  monthNameEn: string;
  formattedBn: string;
  formattedEn: string;
} {
  const date = parseISO(dateKey);
  let y = date.getUTCFullYear();
  let m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();

  const monthNamesBn = [
    "মুহাররম",
    "সফর",
    "রবিউল আউয়াল",
    "রবিউস সানি",
    "জমাদিউল আউয়াল",
    "জমাদিউস সানি",
    "রজব",
    "শাবান",
    "রমজান",
    "শাওয়াল",
    "জিলকদ",
    "জিলহজ",
  ];
  const monthNamesEn = [
    "Muharram",
    "Safar",
    "Rabiʻ I",
    "Rabiʻ II",
    "Jumada I",
    "Jumada II",
    "Rajab",
    "Shaʻban",
    "Ramadan",
    "Shawwal",
    "Dhul-Qaʻdah",
    "Dhul-Hijjah",
  ];

  if (m < 3) {
    y -= 1;
    m += 12;
  }

  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  const jd =
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    d +
    b -
    1524.5;

  const i = Math.floor((jd - 1948439.5) / 29.530588853);
  const epoch = 1948439.5 + i * 29.530588853;
  const days = Math.floor(jd - epoch) + 1;

  let year = Math.floor((30 * (jd - 1948439.5) + 10646) / 10631);
  let month =
    Math.min(
      12,
      Math.ceil((jd - 29 - hijriYearStart(year)) / 29.5) + 1,
    ) || 1;
  let day = days;

  // Fallback safer approximate using Intl when available
  try {
    const parts = new Intl.DateTimeFormat("en-u-ca-islamic", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      timeZone: APP_TIMEZONE,
    }).formatToParts(parseISO(dateKey));

    day = Number(parts.find((p) => p.type === "day")?.value ?? day);
    month = Number(parts.find((p) => p.type === "month")?.value ?? month);
    year = Number(parts.find((p) => p.type === "year")?.value ?? year);
  } catch {
    // keep algorithm values
  }

  const monthNameBn = monthNamesBn[month - 1] ?? "";
  const monthNameEn = monthNamesEn[month - 1] ?? "";

  return {
    day,
    month,
    year,
    monthNameBn,
    monthNameEn,
    formattedBn: `${day} ${monthNameBn} ${year} হিজরি`,
    formattedEn: `${day} ${monthNameEn} ${year} AH`,
  };
}

function hijriYearStart(year: number): number {
  return Math.floor((year - 1) * 354.36667) + 1948439.5;
}

export function shiftDateKey(dateKey: string, days: number): string {
  return format(addDays(parseISO(dateKey), days), "yyyy-MM-dd");
}

export function monthDays(year: number, monthIndex0: number): string[] {
  const start = startOfMonth(new Date(year, monthIndex0, 1));
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
}

export function msUntilNextDhakaMidnight(): number {
  const now = nowInDhaka();
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
}
