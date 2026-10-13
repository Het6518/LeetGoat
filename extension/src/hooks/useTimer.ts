import { useCallback, useEffect, useRef, useState } from "react";
import type { ProblemRecord } from "../types";
import { bumpActivity, storageAvailable, updateProblem } from "../lib/storage";

const PERSIST_EVERY_MS = 15_000;

export interface Timer {
  elapsedMs: number;
  running: boolean;
  start: () => void;
  pause: () => void;
  /** Zeroes the current attempt without touching lifetime totals. */
  reset: () => void;
}

export function isDue(record: ProblemRecord | null | undefined, now = Date.now()): boolean {
  return !!record?.review && record.review.due <= now;
}

/**
 * Per-problem stopwatch. The in-memory value is authoritative while the page
 * is open; it's flushed to storage periodically, on pause, when the tab is
 * hidden and on navigation, so a reload resumes where you left off.
 */
export function useProblemTimer(
  slug: string | null,
  record: ProblemRecord | null | undefined,
  autoStart: boolean
): Timer {
  const base = useRef(0);
  const runStart = useRef<number | null>(null);
  const activeSlug = useRef<string | null>(null);
  const resumeOnVisible = useRef(false);
  // Refs hold the live values; this snapshot is what renders.
  const [snap, setSnap] = useState({ base: 0, runStart: null as number | null, now: 0 });
  const rerender = useCallback(
    () => setSnap({ base: base.current, runStart: runStart.current, now: Date.now() }),
    []
  );

  const flush = useCallback(() => {
    const slugNow = activeSlug.current;
    if (!slugNow || runStart.current === null) return;
    const now = Date.now();
    const delta = now - runStart.current;
    if (delta < 1000) return;
    base.current += delta;
    runStart.current = now;
    if (!storageAvailable()) return;
    const sessionMs = base.current;
    void updateProblem(slugNow, (r) => ({
      ...r,
      timeSpentMs: r.timeSpentMs + delta,
      session: { ...r.session, ms: sessionMs },
    }));
    void bumpActivity({ timeMs: delta });
  }, []);

  const start = useCallback(() => {
    if (runStart.current !== null || !activeSlug.current) return;
    runStart.current = Date.now();
    rerender();
  }, [rerender]);

  const pause = useCallback(() => {
    flush();
    runStart.current = null;
    rerender();
  }, [flush, rerender]);

  const reset = useCallback(() => {
    runStart.current = null;
    base.current = 0;
    const slugNow = activeSlug.current;
    if (slugNow && storageAvailable()) {
      void updateProblem(slugNow, (r) => ({ ...r, session: { ...r.session, ms: 0 } }));
    }
    rerender();
  }, [rerender]);

  // Load the saved session once per problem, as soon as its record is known.
  const recordReady = record !== undefined;
  useEffect(() => {
    if (!slug || !recordReady || activeSlug.current === slug) return;
    activeSlug.current = slug;
    base.current = record?.session.ms ?? 0;
    const solvedAndNotDue = !!record?.solvedAt && !isDue(record);
    const shouldRun = autoStart && !record?.pendingRating && !solvedAndNotDue && !document.hidden;
    runStart.current = shouldRun ? Date.now() : null;
    rerender();
  }, [slug, recordReady, record, autoStart, rerender]);

  // Leaving a problem: save its time before switching.
  useEffect(() => {
    return () => {
      flush();
      runStart.current = null;
      activeSlug.current = null;
    };
  }, [slug, flush]);

  const running = snap.runStart !== null;

  useEffect(() => {
    if (!running) return;
    const tick = window.setInterval(rerender, 1000);
    const save = window.setInterval(flush, PERSIST_EVERY_MS);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(save);
    };
  }, [running, flush, rerender]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        resumeOnVisible.current = runStart.current !== null;
        pause();
      } else if (resumeOnVisible.current) {
        resumeOnVisible.current = false;
        start();
      }
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [flush, pause, start]);

  const elapsedMs = snap.base + (snap.runStart !== null ? Math.max(0, snap.now - snap.runStart) : 0);
  return { elapsedMs, running, start, pause, reset };
}
