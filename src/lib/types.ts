export type UserRole = "wife" | "husband";

export type ActivityStatus = "yes" | "no" | "unanswered";

export type PrayerKey =
  | "fajr"
  | "dhuhr"
  | "asr"
  | "maghrib"
  | "isha"
  | "quran";

export interface Profile {
  id: string;
  display_name: string;
  role: UserRole;
  preferred_locale: "bn" | "en";
  theme: "light" | "dark" | "system";
  reminder_enabled: boolean;
  quran_reminder_enabled: boolean;
  created_at: string;
}

export interface DailyRecord {
  id: string;
  user_id: string;
  record_date: string;
  fajr_status: ActivityStatus;
  dhuhr_status: ActivityStatus;
  asr_status: ActivityStatus;
  maghrib_status: ActivityStatus;
  isha_status: ActivityStatus;
  quran_status: ActivityStatus;
  quran_minutes: number | null;
  notes: string | null;
  fajr_notes: string | null;
  dhuhr_notes: string | null;
  asr_notes: string | null;
  maghrib_notes: string | null;
  isha_notes: string | null;
  quran_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
}

export type DailyRecordUpdate = Partial<
  Pick<
    DailyRecord,
    | "fajr_status"
    | "dhuhr_status"
    | "asr_status"
    | "maghrib_status"
    | "isha_status"
    | "quran_status"
    | "quran_minutes"
    | "notes"
    | "fajr_notes"
    | "dhuhr_notes"
    | "asr_notes"
    | "maghrib_notes"
    | "isha_notes"
    | "quran_notes"
  >
>;

export interface DaySummary {
  date: string;
  completed: number;
  total: number;
  percentage: number;
  allYes: boolean;
  allNo: boolean;
  unansweredCount: number;
  status: "complete" | "partial" | "missed" | "empty";
}

export const ACTIVITY_FIELDS: Record<
  PrayerKey,
  {
    status: keyof DailyRecord;
    notes: keyof DailyRecord;
  }
> = {
  fajr: { status: "fajr_status", notes: "fajr_notes" },
  dhuhr: { status: "dhuhr_status", notes: "dhuhr_notes" },
  asr: { status: "asr_status", notes: "asr_notes" },
  maghrib: { status: "maghrib_status", notes: "maghrib_notes" },
  isha: { status: "isha_status", notes: "isha_notes" },
  quran: { status: "quran_status", notes: "quran_notes" },
};

export const STATUS_KEYS: Array<keyof DailyRecord> = [
  "fajr_status",
  "dhuhr_status",
  "asr_status",
  "maghrib_status",
  "isha_status",
  "quran_status",
];
