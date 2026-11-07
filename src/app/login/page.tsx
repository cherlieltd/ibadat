"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DEMO_HUSBAND_EMAIL,
  DEMO_PASSWORD,
  DEMO_WIFE_EMAIL,
} from "@/lib/constants";

export default function LoginPage() {
  const { login, isDemo } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState(isDemo ? DEMO_WIFE_EMAIL : "");
  const [password, setPassword] = useState(isDemo ? DEMO_PASSWORD : "");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      toast.success(t("greeting"));
      router.replace(user.profile.role === "husband" ? "/admin" : "/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  async function quickLogin(role: "wife" | "husband") {
    setLoading(true);
    try {
      const user = await login(
        role === "wife" ? DEMO_WIFE_EMAIL : DEMO_HUSBAND_EMAIL,
        DEMO_PASSWORD,
      );
      router.replace(user.profile.role === "husband" ? "/admin" : "/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 islamic-pattern opacity-40" />
      <Card className="relative w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-3xl">{t("login")}</CardTitle>
          <CardDescription>
            {isDemo ? t("demoHint") : "Sign in with your secure family account."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("email")}</label>
              <Input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("password")}</label>
              <Input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? t("loading") : t("login")}
            </Button>
          </form>

          {isDemo ? (
            <div className="space-y-2 rounded-3xl border border-dashed border-amber-300/70 bg-amber-50/70 p-4 dark:border-amber-700 dark:bg-amber-950/30">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {t("demoMode")}
              </p>
              <div className="grid gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => void quickLogin("wife")}
                >
                  {t("loginAsWife")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => void quickLogin("husband")}
                >
                  {t("loginAsHusband")}
                </Button>
              </div>
              <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
                {DEMO_WIFE_EMAIL} / {DEMO_HUSBAND_EMAIL} · password: {DEMO_PASSWORD}
              </p>
            </div>
          ) : null}

          <p className="text-center text-sm">
            <Link href="/" className="text-emerald-700 underline-offset-4 hover:underline">
              ← Home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
