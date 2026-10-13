import { useEffect, useRef, useState } from "react";
import { fetchProblem } from "../api/leetcode";
import type { Problem } from "../types";

function readSlug(): string | null {
  // Regular problems and contest problems (/contest/<id>/problems/<slug>/).
  return window.location.pathname.match(/^\/(?:contest\/[^/]+\/)?problems\/([^/]+)/)?.[1] ?? null;
}

/**
 * LeetCode is a single-page app and content scripts can't hook the page's
 * history API, so the cheapest reliable signal is polling the pathname.
 */
export function useProblemSlug(): string | null {
  const [slug, setSlug] = useState(readSlug);
  useEffect(() => {
    const id = window.setInterval(() => setSlug(readSlug()), 600);
    return () => window.clearInterval(id);
  }, []);
  return slug;
}

function pageIsDark(): boolean {
  const root = document.documentElement;
  return root.classList.contains("dark") || root.dataset.theme === "dark";
}

/** Follows LeetCode's own light/dark switch. */
export function useLeetCodeDark(): boolean {
  const [dark, setDark] = useState(pageIsDark);
  useEffect(() => {
    const observer = new MutationObserver(() => setDark(pageIsDark()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    return () => observer.disconnect();
  }, []);
  return dark;
}

const problemCache = new Map<string, Problem>();

export function useProblem(slug: string | null) {
  const [state, setState] = useState<{ slug: string; data: Problem | null; error: string | null }>();

  const cached = slug ? problemCache.get(slug) : undefined;

  useEffect(() => {
    if (!slug || problemCache.has(slug)) return;
    let cancelled = false;
    fetchProblem(slug)
      .then((data) => {
        problemCache.set(slug, data);
        if (!cancelled) setState({ slug, data, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ slug, data: null, error: err instanceof Error ? err.message : String(err) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (cached) return { problem: cached, error: null, loading: false };
  const current = state?.slug === slug ? state : undefined;
  return { problem: current?.data ?? null, error: current?.error ?? null, loading: !!slug && !current };
}

export interface Verdict {
  text: string;
  accepted: boolean;
  submissionId: string | null;
}

const VERDICTS = [
  "Accepted",
  "Wrong Answer",
  "Time Limit Exceeded",
  "Memory Limit Exceeded",
  "Output Limit Exceeded",
  "Runtime Error",
  "Compile Error",
];

/**
 * LeetCode only tags the *Accepted* heading with data-e2e-locator; rejected
 * verdicts are a plain heading. When a submission detail is open (its id is in
 * the URL), fall back to the first visible element whose whole text is a verdict.
 */
function findRejectedHeading(): string | null {
  for (const el of document.querySelectorAll<HTMLElement>("h1, h2, h3, h4, span, div")) {
    if (el.childElementCount > 0) continue;
    const text = el.textContent?.trim() ?? "";
    if (text === "Accepted" || !VERDICTS.includes(text)) continue;
    if (el.offsetParent !== null) return text;
  }
  return null;
}

function readVerdict(): Verdict | null {
  const submissionId = window.location.pathname.match(/\/submissions\/(\d+)/)?.[1] ?? null;
  const el = document.querySelector('[data-e2e-locator="submission-result"]');
  const text = el?.textContent?.trim() ?? "";
  const verdict = VERDICTS.find((v) => text.startsWith(v)) ?? (submissionId ? findRejectedHeading() : null);
  if (!verdict) return null;
  return { text: verdict, accepted: verdict === "Accepted", submissionId };
}

/**
 * Detects submission verdicts by watching LeetCode's result panel.
 * Whatever is already on screen when the page loads is treated as a
 * baseline so revisiting an old submission doesn't count twice.
 */
export function useSubmissionWatcher(slug: string | null, onVerdict: (v: Verdict) => void) {
  const callback = useRef(onVerdict);
  useEffect(() => {
    callback.current = onVerdict;
  });

  useEffect(() => {
    if (!slug) return;
    const keyOf = (v: Verdict | null) => (v ? `${v.submissionId ?? ""}|${v.text}` : null);
    let lastKey = keyOf(readVerdict());

    const id = window.setInterval(() => {
      const verdict = readVerdict();
      const key = keyOf(verdict);
      if (!verdict || key === lastKey) return;
      lastKey = key;
      callback.current(verdict);
    }, 800);
    return () => window.clearInterval(id);
  }, [slug]);
}

const BLIND_STYLE_ID = "leetgoat-blind-mode";
const BLIND_CSS = `
  .text-difficulty-easy, .text-difficulty-medium, .text-difficulty-hard,
  a[href^="/tag/"], a[href*="/company/"] {
    filter: blur(6px) !important;
    transition: filter .15s ease;
  }
  .text-difficulty-easy:hover, .text-difficulty-medium:hover, .text-difficulty-hard:hover,
  a[href^="/tag/"]:hover, a[href*="/company/"]:hover {
    filter: none !important;
  }
`;

/** Interview mode: blurs difficulty, topic and company tags on LeetCode itself. */
export function useBlindMode(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const style = document.createElement("style");
    style.id = BLIND_STYLE_ID;
    style.textContent = BLIND_CSS;
    document.head.appendChild(style);
    return () => style.remove();
  }, [enabled]);
}
