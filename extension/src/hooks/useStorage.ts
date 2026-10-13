import { useEffect, useState } from "react";
import type { Activity, ProblemRecord, Settings } from "../types";
import {
  ACTIVITY_KEY,
  DEFAULT_SETTINGS,
  PROBLEM_PREFIX,
  SETTINGS_KEY,
  getActivity,
  getAllWithPrefix,
  getValue,
  getAllProblems,
  getProblem,
  getSettings,
  saveSettings,
  storageAvailable,
} from "../lib/storage";

type Changes = Record<string, chrome.storage.StorageChange>;

/** Re-runs `load` on mount and whenever a matching storage key changes. */
function useStorageQuery<T>(
  load: () => Promise<T>,
  matches: (key: string) => boolean,
  initial: T,
  deps: unknown[]
): T {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    if (!storageAvailable()) return;
    let cancelled = false;
    const refresh = () =>
      load()
        .then((v) => !cancelled && setValue(v))
        .catch(() => undefined);

    void refresh();
    const listener = (changes: Changes, area: string) => {
      if (area === "local" && Object.keys(changes).some(matches)) void refresh();
    };
    chrome.storage.onChanged.addListener(listener);
    return () => {
      cancelled = true;
      chrome.storage.onChanged.removeListener(listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const settings = useStorageQuery(getSettings, (k) => k === SETTINGS_KEY, DEFAULT_SETTINGS, []);
  return [settings, (patch) => void saveSettings(patch)];
}

export function useActivity(): Activity {
  return useStorageQuery(getActivity, (k) => k === ACTIVITY_KEY, {}, []);
}

export function useAllProblems(): ProblemRecord[] {
  return useStorageQuery(getAllProblems, (k) => k.startsWith(PROBLEM_PREFIX), [], []);
}

/** `undefined` while loading, `null` if LeetGoat has never seen this problem. */
export function useProblemRecord(slug: string | null): ProblemRecord | null | undefined {
  const [state, setState] = useState<{ slug: string | null; record: ProblemRecord | null }>();

  useEffect(() => {
    if (!slug || !storageAvailable()) return;
    let cancelled = false;
    const key = PROBLEM_PREFIX + slug;
    getProblem(slug)
      .then((record) => !cancelled && setState({ slug, record }))
      .catch(() => undefined);

    const listener = (changes: Changes, area: string) => {
      if (area !== "local" || !(key in changes)) return;
      setState({ slug, record: (changes[key].newValue as ProblemRecord | undefined) ?? null });
    };
    chrome.storage.onChanged.addListener(listener);
    return () => {
      cancelled = true;
      chrome.storage.onChanged.removeListener(listener);
    };
  }, [slug]);

  return state && state.slug === slug ? state.record : undefined;
}

/** Any single storage key, live. */
export function useStorageValue<T>(key: string, fallback: T): T {
  return useStorageQuery(() => getValue(key, fallback), (k) => k === key, fallback, [key]);
}

/** Every value whose key starts with `prefix`, live. */
export function useStoragePrefix<T>(prefix: string): T[] {
  return useStorageQuery(() => getAllWithPrefix<T>(prefix), (k) => k.startsWith(prefix), [] as T[], [prefix]);
}
