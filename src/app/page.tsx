"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MoonStar, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { APP_NAME, APP_NAME_BN } from "@/lib/constants";

export default function LandingPage() {
  const { t, locale } = useLocale();
  const { user, isDemo } = useAuth();

  const href = user
    ? user.profile.role === "husband"
      ? "/admin"
      : "/dashboard"
    : "/login";

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 islamic-pattern opacity-50 dark:opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.22),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(212,160,23,0.18),transparent_30%),linear-gradient(180deg,#ecfdf5_0%,#f7f4ea_45%,#fffbeb_100%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.18),transparent_35%),linear-gradient(180deg,#071f18_0%,#0a241c_100%)]" />

      <main className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-between px-5 pb-10 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-emerald-800 shadow-sm backdrop-blur dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Private family ibadah tracker
          </div>

          <div className="space-y-4">
            <p className="font-display text-5xl leading-none text-emerald-900 dark:text-emerald-50 sm:text-6xl">
              {locale === "bn" ? APP_NAME_BN : APP_NAME}
            </p>
            <h1 className="max-w-md text-2xl font-semibold leading-snug text-emerald-950/90 dark:text-emerald-100">
              {t("welcomeTitle")}
            </h1>
            <p className="max-w-md text-base leading-relaxed text-emerald-800/75 dark:text-emerald-200/75">
              {t("welcomeSubtitle")}
            </p>
          </div>

          <div className="grid gap-3">
            <Feature
              icon={<MoonStar className="h-5 w-5" />}
              title={locale === "bn" ? "সহজ হ্যাঁ/না ট্র্যাকিং" : "Simple Yes/No tracking"}
              body={
                locale === "bn"
                  ? "পাঁচ ওয়াক্ত নামাজ ও কোরআন তিলাওয়াত এক ট্যাপে।"
                  : "Five prayers and Quran recitation in one tap."
              }
            />
            <Feature
              icon={<ShieldCheck className="h-5 w-5" />}
              title={locale === "bn" ? "প্রাইভেট ও সুরক্ষিত" : "Private & secure"}
              body={
                locale === "bn"
                  ? "স্ত্রীর ট্র্যাকার, স্বামীর রিড-ওনলি অ্যাডমিন।"
                  : "Wife tracker with husband read-only admin view."
              }
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-10 space-y-3"
        >
          <Button asChild size="lg" className="w-full">
            <Link href={href}>
              {t("getStarted")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          {isDemo ? (
            <p className="text-center text-xs text-emerald-800/70 dark:text-emerald-200/70">
              {t("demoMode")}: {t("demoHint")}
            </p>
          ) : null}
        </motion.div>
      </main>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-3xl border border-emerald-100/80 bg-white/75 p-4 shadow-sm backdrop-blur dark:border-emerald-900 dark:bg-emerald-950/40">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-emerald-950 dark:text-emerald-50">{title}</p>
        <p className="mt-1 text-sm text-emerald-800/70 dark:text-emerald-200/70">{body}</p>
      </div>
    </div>
  );
}
