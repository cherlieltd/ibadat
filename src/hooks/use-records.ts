"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getOrCreateRecord,
  listRecords,
  resolveTrackedUserId,
  subscribeToRecords,
  updateRecord,
} from "@/lib/data";
import { todayKey, msUntilNextDhakaMidnight } from "@/lib/dates";
import type { AuthUser, DailyRecord, DailyRecordUpdate } from "@/lib/types";

export function useTodayKey() {
  const [date, setDate] = useState(todayKey());

  useEffect(() => {
    const tick = () => setDate(todayKey());
    tick();
    let intervalId = 0;
    const timeoutId = window.setTimeout(() => {
      tick();
      intervalId = window.setInterval(tick, 60_000);
    }, msUntilNextDhakaMidnight() + 250);
    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  return date;
}

export function useTrackedRecords(user: AuthUser | null) {
  const today = useTodayKey();
  const [trackedUserId, setTrackedUserId] = useState<string | null>(null);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<DailyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canWrite = user?.profile.role === "wife";

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const id = await resolveTrackedUserId(user);
      setTrackedUserId(id);
      const [all, current] = await Promise.all([
        listRecords(id),
        getOrCreateRecord(id, today),
      ]);
      setRecords(all);
      setTodayRecord(current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void reload();
    });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  useEffect(() => {
    if (!trackedUserId) return;
    return subscribeToRecords(trackedUserId, () => {
      void reload();
    });
  }, [trackedUserId, reload]);

  const save = useCallback(
    async (date: string, patch: DailyRecordUpdate) => {
      if (!trackedUserId || !canWrite) return null;
      setSaving(true);
      setError(null);
      try {
        const updated = await updateRecord(trackedUserId, date, patch, canWrite);
        setRecords((prev) => {
          const others = prev.filter((r) => r.record_date !== date);
          return [updated, ...others].sort((a, b) =>
            b.record_date.localeCompare(a.record_date),
          );
        });
        if (date === today) setTodayRecord(updated);
        setSavedFlash(true);
        window.setTimeout(() => setSavedFlash(false), 1200);
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [trackedUserId, canWrite, today],
  );

  const getRecordForDate = useCallback(
    async (date: string) => {
      if (!trackedUserId) return null;
      const record = await getOrCreateRecord(trackedUserId, date);
      setRecords((prev) => {
        if (prev.some((r) => r.record_date === date)) return prev;
        return [record, ...prev].sort((a, b) =>
          b.record_date.localeCompare(a.record_date),
        );
      });
      return record;
    },
    [trackedUserId],
  );

  return {
    today,
    trackedUserId,
    records,
    todayRecord,
    loading,
    saving,
    savedFlash,
    error,
    canWrite,
    reload,
    save,
    getRecordForDate,
  };
}
