import type { PrayerKey } from "./types";

export const APP_NAME = "My Daily Ibadah";
export const APP_NAME_BN = "আমার দৈনিক ইবাদত";
export const QURAN_TARGET_MINUTES = 60;

export const PRAYERS: Array<{
  key: PrayerKey;
  icon: string;
  nameEn: string;
  nameBn: string;
  accent: string;
}> = [
  {
    key: "fajr",
    icon: "🌅",
    nameEn: "Fajr",
    nameBn: "ফজর",
    accent: "from-sky-400/30 to-emerald-200/20",
  },
  {
    key: "dhuhr",
    icon: "☀️",
    nameEn: "Dhuhr",
    nameBn: "যোহর",
    accent: "from-amber-300/30 to-emerald-100/20",
  },
  {
    key: "asr",
    icon: "🌤️",
    nameEn: "Asr",
    nameBn: "আসর",
    accent: "from-orange-200/30 to-emerald-100/20",
  },
  {
    key: "maghrib",
    icon: "🌇",
    nameEn: "Maghrib",
    nameBn: "মাগরিব",
    accent: "from-rose-300/25 to-emerald-100/20",
  },
  {
    key: "isha",
    icon: "🌙",
    nameEn: "Isha",
    nameBn: "এশা",
    accent: "from-indigo-300/25 to-emerald-100/20",
  },
  {
    key: "quran",
    icon: "📖",
    nameEn: "Quran Recitation",
    nameBn: "কোরআন তিলাওয়াত",
    accent: "from-emerald-300/30 to-amber-100/20",
  },
];

export const MOTIVATIONAL_MESSAGES = {
  bn: [
    "প্রতিটি নামাজ হৃদয়কে প্রশান্ত করে।",
    "ছোট ছোট ইবাদতেই বড় বরকত।",
    "আজকের আমলই আখিরাতের সম্পদ।",
    "কোরআন তিলাওয়াত মনকে নূরময় করে।",
    "সবর ও শুকরেই প্রকৃত সফলতা।",
  ],
  en: [
    "Every prayer softens the heart.",
    "Small consistent worship brings great barakah.",
    "Today’s deeds become tomorrow’s treasure.",
    "Quran recitation fills the heart with light.",
    "Patience and gratitude are true success.",
  ],
};

export const DEMO_WIFE_EMAIL = "wife@demo.local";
export const DEMO_HUSBAND_EMAIL = "husband@demo.local";
export const DEMO_PASSWORD = "demo1234";
