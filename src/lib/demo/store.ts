import {
  DEMO_HUSBAND_EMAIL,
  DEMO_PASSWORD,
  DEMO_WIFE_EMAIL,
} from "@/lib/constants";
import { todayKey, shiftDateKey } from "@/lib/dates";
import type {
  ActivityStatus,
  AuthUser,
  DailyRecord,
  DailyRecordUpdate,
  Profile,
} from "@/lib/types";
import { createEmptyRecord } from "@/lib/utils";

const STORAGE_KEY = "ibadat-demo-v1";
const SESSION_KEY = "ibadat-demo-session";

interface DemoState {
  profiles: Profile[];
  records: DailyRecord[];
  credentials: Array<{ email: string; password: string; userId: string }>;
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildSampleRecords(wifeId: string): DailyRecord[] {
  const today = todayKey();
  const records: DailyRecord[] = [];

  for (let i = 0; i < 28; i += 1) {
    const date = shiftDateKey(today, -i);
    const base = createEmptyRecord(wifeId, date);

    if (i === 0) {
      records.push({
        ...base,
        fajr_status: "yes",
        dhuhr_status: "yes",
        asr_status: "yes",
        maghrib_status: "unanswered",
        isha_status: "unanswered",
        quran_status: "yes",
        quran_minutes: 45,
      });
      continue;
    }

    const pattern = i % 5;
    const yes = (n: number): ActivityStatus => (n <= pattern ? "yes" : i % 7 === 0 ? "no" : "unanswered");

    records.push({
      ...base,
      fajr_status: yes(0),
      dhuhr_status: yes(1),
      asr_status: yes(2),
      maghrib_status: yes(3),
      isha_status: yes(4),
      quran_status: i % 3 === 0 ? "yes" : i % 4 === 0 ? "no" : "unanswered",
      quran_minutes: i % 3 === 0 ? 40 + (i % 25) : null,
    });
  }

  return records;
}

function seed(): DemoState {
  const wifeId = "demo-wife";
  const husbandId = "demo-husband";
  const now = new Date().toISOString();

  return {
    profiles: [
      {
        id: wifeId,
        display_name: "আয়েশা",
        role: "wife",
        preferred_locale: "bn",
        theme: "system",
        reminder_enabled: true,
        quran_reminder_enabled: true,
        created_at: now,
      },
      {
        id: husbandId,
        display_name: "আব্দুল্লাহ",
        role: "husband",
        preferred_locale: "en",
        theme: "system",
        reminder_enabled: false,
        quran_reminder_enabled: false,
        created_at: now,
      },
    ],
    records: buildSampleRecords(wifeId),
    credentials: [
      { email: DEMO_WIFE_EMAIL, password: DEMO_PASSWORD, userId: wifeId },
      { email: DEMO_HUSBAND_EMAIL, password: DEMO_PASSWORD, userId: husbandId },
    ],
  };
}

function readState(): DemoState {
  if (typeof window === "undefined") return seed();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  return JSON.parse(raw) as DemoState;
}

function writeState(state: DemoState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("ibadat-demo-updated"));
}

export function demoGetSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  const { userId } = JSON.parse(raw) as { userId: string };
  const state = readState();
  const profile = state.profiles.find((p) => p.id === userId);
  const cred = state.credentials.find((c) => c.userId === userId);
  if (!profile || !cred) return null;
  return { id: userId, email: cred.email, profile };
}

export function demoLogin(email: string, password: string): AuthUser {
  const state = readState();
  const cred = state.credentials.find(
    (c) => c.email.toLowerCase() === email.toLowerCase() && c.password === password,
  );
  if (!cred) throw new Error("Invalid email or password");
  const profile = state.profiles.find((p) => p.id === cred.userId);
  if (!profile) throw new Error("Profile not found");
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId: cred.userId }));
  return { id: cred.userId, email: cred.email, profile };
}

export function demoLogout() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function demoGetTrackedUserId(viewer: AuthUser): string {
  if (viewer.profile.role === "wife") return viewer.id;
  const state = readState();
  const wife = state.profiles.find((p) => p.role === "wife");
  return wife?.id ?? viewer.id;
}

export function demoGetRecords(userId: string): DailyRecord[] {
  return readState()
    .records.filter((r) => r.user_id === userId)
    .sort((a, b) => b.record_date.localeCompare(a.record_date));
}

export function demoGetRecord(userId: string, date: string): DailyRecord {
  const state = readState();
  const existing = state.records.find(
    (r) => r.user_id === userId && r.record_date === date,
  );
  if (existing) return existing;
  const created = createEmptyRecord(userId, date);
  created.id = uid("rec");
  state.records.push(created);
  writeState(state);
  return created;
}

export function demoUpdateRecord(
  userId: string,
  date: string,
  patch: DailyRecordUpdate,
): DailyRecord {
  const state = readState();
  let record = state.records.find(
    (r) => r.user_id === userId && r.record_date === date,
  );
  if (!record) {
    record = { ...createEmptyRecord(userId, date), id: uid("rec") };
    state.records.push(record);
  }
  Object.assign(record, patch, { updated_at: new Date().toISOString() });
  writeState(state);
  return { ...record };
}

export function demoUpdateProfile(
  userId: string,
  patch: Partial<Profile>,
): Profile {
  const state = readState();
  const profile = state.profiles.find((p) => p.id === userId);
  if (!profile) throw new Error("Profile not found");
  Object.assign(profile, patch);
  writeState(state);
  return { ...profile };
}

export function subscribeDemo(callback: () => void) {
  const handler = () => callback();
  window.addEventListener("ibadat-demo-updated", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("ibadat-demo-updated", handler);
    window.removeEventListener("storage", handler);
  };
}

export function resetDemoData() {
  localStorage.removeItem(STORAGE_KEY);
  writeState(seed());
}
