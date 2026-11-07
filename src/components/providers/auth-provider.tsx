"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  login as dataLogin,
  logout as dataLogout,
  updateProfile as dataUpdateProfile,
} from "@/lib/data";
import type { AuthUser, Profile } from "@/lib/types";
import { isDemoMode } from "@/lib/config";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const isDemo = isDemoMode();

  const refresh = useCallback(async () => {
    try {
      const current = await getCurrentUser();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const next = await dataLogin(email, password);
    setUser(next);
    return next;
  }, []);

  const logout = useCallback(async () => {
    await dataLogout();
    setUser(null);
    router.push("/login");
  }, [router]);

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!user) return;
      const profile = await dataUpdateProfile(user.id, patch);
      setUser({ ...user, profile });
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isDemo,
      login,
      logout,
      refresh,
      updateProfile,
    }),
    [user, loading, isDemo, login, logout, refresh, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
