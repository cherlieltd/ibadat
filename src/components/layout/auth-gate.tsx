"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import type { UserRole } from "@/lib/types";

export function AuthGate({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: UserRole[];
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (roles && !roles.includes(user.profile.role)) {
      router.replace(user.profile.role === "husband" ? "/admin" : "/dashboard");
    }
  }, [user, loading, roles, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
      </div>
    );
  }

  if (roles && !roles.includes(user.profile.role)) return null;

  return <>{children}</>;
}
