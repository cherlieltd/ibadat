import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig, isDemoMode } from "@/lib/config";

export function createClient() {
  if (isDemoMode()) {
    throw new Error("Demo mode active — Supabase browser client unavailable");
  }
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey);
}
