"use client";

import { isDemoMode } from "@/lib/config";
import {
  demoGetRecord,
  demoGetRecords,
  demoGetSession,
  demoGetTrackedUserId,
  demoLogin,
  demoLogout,
  demoUpdateProfile,
  demoUpdateRecord,
  subscribeDemo,
} from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/client";
import type {
  AuthUser,
  DailyRecord,
  DailyRecordUpdate,
  Profile,
} from "@/lib/types";
import { createEmptyRecord } from "@/lib/utils";

async function fetchProfile(userId: string): Promise<Profile> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (isDemoMode()) return demoGetSession();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const profile = await fetchProfile(user.id);
  return { id: user.id, email: user.email, profile };
}

export async function login(email: string, password: string): Promise<AuthUser> {
  if (isDemoMode()) return demoLogin(email, password);

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user?.email) throw error ?? new Error("Login failed");
  const profile = await fetchProfile(data.user.id);
  return { id: data.user.id, email: data.user.email, profile };
}

export async function logout(): Promise<void> {
  if (isDemoMode()) {
    demoLogout();
    return;
  }
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function resolveTrackedUserId(viewer: AuthUser): Promise<string> {
  if (isDemoMode()) return demoGetTrackedUserId(viewer);
  if (viewer.profile.role === "wife") return viewer.id;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "wife")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? viewer.id;
}

export async function getOrCreateRecord(
  userId: string,
  date: string,
): Promise<DailyRecord> {
  if (isDemoMode()) return demoGetRecord(userId, date);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("daily_records")
    .select("*")
    .eq("user_id", userId)
    .eq("record_date", date)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as DailyRecord;

  const empty = createEmptyRecord(userId, date);
  const { data: inserted, error: insertError } = await supabase
    .from("daily_records")
    .insert({
      user_id: userId,
      record_date: date,
    })
    .select("*")
    .single();

  if (insertError) {
    // Race: another insert may have won
    const { data: again } = await supabase
      .from("daily_records")
      .select("*")
      .eq("user_id", userId)
      .eq("record_date", date)
      .single();
    if (again) return again as DailyRecord;
    throw insertError;
  }

  return (inserted as DailyRecord) ?? empty;
}

export async function listRecords(userId: string): Promise<DailyRecord[]> {
  if (isDemoMode()) return demoGetRecords(userId);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("daily_records")
    .select("*")
    .eq("user_id", userId)
    .order("record_date", { ascending: false });
  if (error) throw error;
  return (data as DailyRecord[]) ?? [];
}

export async function updateRecord(
  userId: string,
  date: string,
  patch: DailyRecordUpdate,
  canWrite: boolean,
): Promise<DailyRecord> {
  if (!canWrite) throw new Error("Read-only access");
  if (isDemoMode()) return demoUpdateRecord(userId, date, patch);

  const existing = await getOrCreateRecord(userId, date);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("daily_records")
    .update(patch)
    .eq("id", existing.id)
    .select("*")
    .single();
  if (error) throw error;
  return data as DailyRecord;
}

export async function updateProfile(
  userId: string,
  patch: Partial<Profile>,
): Promise<Profile> {
  if (isDemoMode()) return demoUpdateProfile(userId, patch);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Profile;
}

export function subscribeToRecords(
  userId: string,
  onChange: () => void,
): () => void {
  if (isDemoMode()) return subscribeDemo(onChange);

  const supabase = createClient();
  const channel = supabase
    .channel(`daily_records:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "daily_records",
        filter: `user_id=eq.${userId}`,
      },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
