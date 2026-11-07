import { APP_TIMEZONE, todayKey } from "@/lib/dates";

/** Bogura (বগুড়া), Bangladesh */
export const BOGURA = {
  name: "Bogura",
  nameBn: "বগুড়া",
  latitude: 24.8465,
  longitude: 89.377,
  timezone: APP_TIMEZONE,
  /** Karachi method — common in South Asia */
  method: 1,
  /** Hanafi Asr */
  school: 1,
} as const;

export type PrayerTimeKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export interface PrayerTimings {
  date: string;
  timezone: string;
  location: string;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  sunrise: string;
}

const CACHE_KEY = "rimi-prayer-timings-v1";

const PRAYER_ORDER: PrayerTimeKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export function prayerLabel(key: PrayerTimeKey, locale: "bn" | "en") {
  const map = {
    fajr: { bn: "ফজর", en: "Fajr" },
    dhuhr: { bn: "যোহর", en: "Dhuhr" },
    asr: { bn: "আসর", en: "Asr" },
    maghrib: { bn: "মাগরিব", en: "Maghrib" },
    isha: { bn: "এশা", en: "Isha" },
  } as const;
  return map[key][locale];
}

function readCache(date: string): PrayerTimings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PrayerTimings;
    if (parsed.date !== date) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(timings: PrayerTimings) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(timings));
}

export async function getBoguraPrayerTimes(
  date = todayKey(),
): Promise<PrayerTimings> {
  const cached = readCache(date);
  if (cached) return cached;

  const [y, m, d] = date.split("-");
  const dateParam = `${d}-${m}-${y}`;
  const url =
    `https://api.aladhan.com/v1/timings/${dateParam}` +
    `?latitude=${BOGURA.latitude}` +
    `&longitude=${BOGURA.longitude}` +
    `&method=${BOGURA.method}` +
    `&school=${BOGURA.school}` +
    `&timezonestring=${encodeURIComponent(BOGURA.timezone)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load prayer times");
  const json = (await res.json()) as {
    data: { timings: Record<string, string> };
  };
  const t = json.data.timings;

  const timings: PrayerTimings = {
    date,
    timezone: BOGURA.timezone,
    location: BOGURA.name,
    fajr: cleanTime(t.Fajr),
    dhuhr: cleanTime(t.Dhuhr),
    asr: cleanTime(t.Asr),
    maghrib: cleanTime(t.Maghrib),
    isha: cleanTime(t.Isha),
    sunrise: cleanTime(t.Sunrise),
  };

  if (typeof window !== "undefined") writeCache(timings);
  return timings;
}

function cleanTime(value: string) {
  return value.replace(/\s*\(.*\)$/, "").trim();
}

/** Convert HH:mm on a Dhaka calendar date to a Date object (Bogura = UTC+6) */
export function prayerTimeToDate(dateKey: string, hhmm: string): Date {
  const [h, m] = hhmm.split(":");
  return new Date(`${dateKey}T${h.padStart(2, "0")}:${m.padStart(2, "0")}:00+06:00`);
}

export function getUpcomingPrayers(timings: PrayerTimings, from = new Date()) {
  return PRAYER_ORDER.map((key) => {
    const time = timings[key];
    const at = prayerTimeToDate(timings.date, time);
    return { key, time, at, remainingMs: at.getTime() - from.getTime() };
  }).filter((p) => p.remainingMs > 0);
}

export function getNextPrayer(timings: PrayerTimings, from = new Date()) {
  return getUpcomingPrayers(timings, from)[0] ?? null;
}

export { PRAYER_ORDER };
