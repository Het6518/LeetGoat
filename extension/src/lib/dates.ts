import type { Activity } from "../types";

export const MINUTE = 60_000;
export const DAY = 86_400_000;

const pad = (n: number) => String(n).padStart(2, "0");

export function dayKey(ts = Date.now()): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function startOfDay(ts = Date.now()): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Midnight `days` calendar days after `ts` (DST-safe). */
export function addDays(ts: number, days: number): number {
  const d = new Date(startOfDay(ts));
  d.setDate(d.getDate() + days);
  return d.getTime();
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function formatDuration(ms: number): string {
  const mins = Math.round(ms / MINUTE);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatInterval(days: number): string {
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

/** "overdue 3d", "today", "tomorrow", "in 5d" */
export function formatDue(due: number, now = Date.now()): string {
  const diff = Math.round((startOfDay(due) - startOfDay(now)) / DAY);
  if (diff < 0) return `overdue ${-diff}d`;
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  return `in ${formatInterval(diff)}`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isActive(activity: Activity, key: string): boolean {
  const day = activity[key];
  return !!day && day.solved + day.reviewed > 0;
}

/**
 * A streak survives until the end of today, so an inactive "today"
 * doesn't break it — counting starts from yesterday instead.
 */
export function computeStreaks(activity: Activity, now = Date.now()) {
  let cursor = isActive(activity, dayKey(now)) ? startOfDay(now) : addDays(now, -1);
  let current = 0;
  while (isActive(activity, dayKey(cursor))) {
    current++;
    cursor = addDays(cursor, -1);
  }

  const keys = Object.keys(activity)
    .filter((k) => isActive(activity, k))
    .sort();
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const key of keys) {
    const [y, m, d] = key.split("-").map(Number);
    const ts = new Date(y, m - 1, d).getTime();
    run = prev !== null && addDays(prev, 1) === ts ? run + 1 : 1;
    best = Math.max(best, run);
    prev = ts;
  }

  return { current, best: Math.max(best, current) };
}
