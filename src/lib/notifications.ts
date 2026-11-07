import {
  BOGURA,
  getBoguraPrayerTimes,
  getUpcomingPrayers,
  prayerLabel,
  prayerTimeToDate,
  type PrayerTimeKey,
} from "@/lib/prayer-times";

const TIMER_KEY = "rimi-prayer-timers";

type Locale = "bn" | "en";

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

function clearScheduledTimers() {
  const raw = sessionStorage.getItem(TIMER_KEY);
  if (!raw) return;
  try {
    const ids = JSON.parse(raw) as number[];
    ids.forEach((id) => window.clearTimeout(id));
  } catch {
    // ignore
  }
  sessionStorage.removeItem(TIMER_KEY);
}

function rememberTimer(id: number) {
  const raw = sessionStorage.getItem(TIMER_KEY);
  const ids: number[] = raw ? (JSON.parse(raw) as number[]) : [];
  ids.push(id);
  sessionStorage.setItem(TIMER_KEY, JSON.stringify(ids));
}

async function showPrayerNotification(title: string, body: string, tag: string) {
  const options: NotificationOptions & { renotify?: boolean } = {
    body,
    tag,
    renotify: true,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    lang: "bn",
    data: { url: "/dashboard" },
  };

  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, options);
    return;
  }

  new Notification(title, options);
}

export async function scheduleBoguraPrayerNotifications(options: {
  locale: Locale;
  prayerEnabled: boolean;
  quranEnabled: boolean;
}) {
  clearScheduledTimers();

  if (!options.prayerEnabled && !options.quranEnabled) return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const timings = await getBoguraPrayerTimes();
  const upcoming = getUpcomingPrayers(timings);

  if (options.prayerEnabled) {
    for (const prayer of upcoming) {
      // Notify at prayer time
      scheduleAt(prayer.remainingMs, () => {
        void showPrayerNotification(
          options.locale === "bn"
            ? `${prayerLabel(prayer.key, "bn")} এর সময় হয়েছে`
            : `Time for ${prayerLabel(prayer.key, "en")}`,
          options.locale === "bn"
            ? `বগুড়া · ${prayer.time} (Asia/Dhaka)`
            : `Bogura · ${prayer.time} (Asia/Dhaka)`,
          `prayer-${prayer.key}-${timings.date}`,
        );
      });

      // Optional gentle reminder 10 minutes before (if > 10m away)
      const lead = prayer.remainingMs - 10 * 60 * 1000;
      if (lead > 5_000) {
        scheduleAt(lead, () => {
          void showPrayerNotification(
            options.locale === "bn"
              ? `${prayerLabel(prayer.key, "bn")} — ১০ মিনিট বাকি`
              : `${prayerLabel(prayer.key, "en")} in 10 minutes`,
            options.locale === "bn"
              ? `প্রস্তুতি নিন · বগুড়া`
              : `Get ready · Bogura`,
            `prayer-soon-${prayer.key}-${timings.date}`,
          );
        });
      }
    }
  }

  if (options.quranEnabled) {
    // Evening Quran reminder: 30 minutes after Maghrib
    const maghrib = upcoming.find((p) => p.key === "maghrib");
    const maghribDate = maghrib?.at ?? prayerTimeToDate(timings.date, timings.maghrib);
    const quranAt = new Date(maghribDate.getTime() + 30 * 60 * 1000);
    const delay = quranAt.getTime() - Date.now();
    if (delay > 5_000) {
      scheduleAt(delay, () => {
        void showPrayerNotification(
          options.locale === "bn" ? "কোরআন তিলাওয়াতের সময়" : "Quran recitation time",
          options.locale === "bn"
            ? "আজকের ৬০ মিনিট তিলাওয়াত সম্পন্ন করুন"
            : "Complete today's 60 minutes of Quran",
          `quran-${timings.date}`,
        );
      });
    }
  }
}

function scheduleAt(delayMs: number, fn: () => void) {
  // Browsers clamp setTimeout; chunk long delays daily is enough for prayer times (< 24h)
  if (delayMs <= 0 || delayMs > 36 * 60 * 60 * 1000) return;
  const id = window.setTimeout(fn, delayMs);
  rememberTimer(id);
}

export async function sendTestNotification(locale: Locale) {
  const permission = await ensureNotificationPermission();
  if (permission !== "granted") throw new Error("Notification permission denied");
  await showPrayerNotification(
    locale === "bn" ? "রিমি নোটিফিকেশন চালু" : "Rimi notifications enabled",
    locale === "bn"
      ? `বগুড়া নামাজের সময়ের রিমাইন্ডার সেট হয়েছে (${BOGURA.timezone})`
      : `Bogura prayer reminders are set (${BOGURA.timezone})`,
    "rimi-test",
  );
}

export type { PrayerTimeKey };
