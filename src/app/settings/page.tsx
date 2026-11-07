"use client";

import { useTheme } from "next-themes";
import { AuthGate } from "@/components/layout/auth-gate";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { isDemoMode } from "@/lib/config";
import { resetDemoData } from "@/lib/demo/store";
import type { Locale } from "@/lib/i18n/messages";
import {
  ensureNotificationPermission,
  scheduleBoguraPrayerNotifications,
  sendTestNotification,
} from "@/lib/notifications";
import { toast } from "sonner";

export default function SettingsPage() {
  return (
    <AuthGate>
      <SettingsContent />
    </AuthGate>
  );
}

function SettingsContent() {
  const { user, logout, updateProfile, isDemo } = useAuth();
  const { t, locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();

  if (!user) return null;

  async function enableAndSchedule(
    nextPrayer: boolean,
    nextQuran: boolean,
  ) {
    if (nextPrayer || nextQuran) {
      const permission = await ensureNotificationPermission();
      if (permission !== "granted") {
        toast.error(t("notificationPermissionNeeded"));
        return false;
      }
    }

    await updateProfile({
      reminder_enabled: nextPrayer,
      quran_reminder_enabled: nextQuran,
    });

    if (user!.profile.role === "wife") {
      await scheduleBoguraPrayerNotifications({
        locale,
        prayerEnabled: nextPrayer,
        quranEnabled: nextQuran,
      });
    }

    toast.success(t("saved"));
    return true;
  }

  async function toggleReminder(key: "reminder_enabled" | "quran_reminder_enabled") {
    const nextPrayer =
      key === "reminder_enabled" ? !user!.profile.reminder_enabled : user!.profile.reminder_enabled;
    const nextQuran =
      key === "quran_reminder_enabled"
        ? !user!.profile.quran_reminder_enabled
        : user!.profile.quran_reminder_enabled;
    await enableAndSchedule(nextPrayer, nextQuran);
  }

  async function onTestNotification() {
    if (!user) return;
    try {
      await sendTestNotification(locale);
      await scheduleBoguraPrayerNotifications({
        locale,
        prayerEnabled: true,
        quranEnabled: user.profile.quran_reminder_enabled,
      });
      if (!user.profile.reminder_enabled) {
        await updateProfile({ reminder_enabled: true });
      }
      toast.success(t("saved"));
    } catch {
      toast.error(t("notificationPermissionNeeded"));
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="font-display text-3xl text-emerald-950 dark:text-emerald-50">
          {t("settings")}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>{t("profile")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Display name</label>
              <Input
                defaultValue={user.profile.display_name}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (value && value !== user.profile.display_name) {
                    void updateProfile({ display_name: value }).then(() =>
                      toast.success(t("saved")),
                    );
                  }
                }}
              />
            </div>
            <p className="text-sm text-emerald-800/70 dark:text-emerald-200/70">
              {user.email} · {user.profile.role}
              {isDemo ? ` · ${t("demoMode")}` : null}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("language")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {(["bn", "en"] as Locale[]).map((code) => (
              <Button
                key={code}
                variant={locale === code ? "default" : "outline"}
                onClick={() => {
                  setLocale(code);
                  void updateProfile({ preferred_locale: code });
                }}
              >
                {code === "bn" ? "বাংলা" : "English"}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2">
            {(["light", "dark", "system"] as const).map((value) => (
              <Button
                key={value}
                variant={theme === value ? "default" : "outline"}
                onClick={() => {
                  setTheme(value);
                  void updateProfile({ theme: value });
                }}
              >
                {value}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("reminders")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{t("prayerReminder")}</p>
                <p className="text-xs text-emerald-800/60">{t("prayerReminderHint")}</p>
              </div>
              <Switch
                checked={user.profile.reminder_enabled}
                onCheckedChange={() => void toggleReminder("reminder_enabled")}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{t("quranReminder")}</p>
                <p className="text-xs text-emerald-800/60">{t("quranReminderHint")}</p>
              </div>
              <Switch
                checked={user.profile.quran_reminder_enabled}
                onCheckedChange={() => void toggleReminder("quran_reminder_enabled")}
              />
            </div>
            <Button variant="outline" className="w-full" onClick={() => void onTestNotification()}>
              {t("testNotification")}
            </Button>
            <p className="text-xs leading-relaxed text-emerald-800/60 dark:text-emerald-200/60">
              {locale === "bn"
                ? "iPhone: হোম স্ক্রিন অ্যাপ থেকে অনুমতি দিন। ফোন স্লিপ থাকলেও ভালো কাজ করতে অ্যাপ মাঝে মাঝে খুলুন।"
                : "iPhone: allow permission from the Home Screen app. Open the app occasionally so schedules refresh after sleep."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("installApp")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-emerald-800/80 dark:text-emerald-200/80">
            <p>iPhone: Share → Add to Home Screen</p>
            <p>Android: Browser menu → Install app / Add to Home screen</p>
          </CardContent>
        </Card>

        {isDemoMode() ? (
          <Button
            variant="outline"
            onClick={() => {
              resetDemoData();
              toast.success("Demo data reset");
              window.location.reload();
            }}
          >
            Reset demo data
          </Button>
        ) : null}

        <Button variant="danger" className="w-full" onClick={() => void logout()}>
          {t("logout")}
        </Button>
      </div>
    </AppShell>
  );
}
