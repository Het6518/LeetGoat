import type {
  Activity,
  DayActivity,
  Problem,
  ProblemRecord,
  Settings,
} from "../types";
import { dayKey } from "./dates";

/**
 * Everything lives in chrome.storage.local so the sidebar, popup and
 * background worker share one source of truth. Each problem gets its own
 * key ("p:<slug>") so frequent timer writes don't rewrite the whole deck.
 */
export const PROBLEM_PREFIX = "p:";
export const SETTINGS_KEY = "settings";
export const ACTIVITY_KEY = "activity";

export const SNIPPETS_KEY = "snippets";
export const SOUND_KEY = (kind: "success" | "fail") => `sound:${kind}`;

export const DEFAULT_SETTINGS: Settings = {
  dailyGoal: 3,
  theme: "auto",
  autoTimer: true,
  hideTopics: true,
  blindMode: false,
  trackPastes: true,
  targets: { Easy: 15, Medium: 30, Hard: 45 },
  sounds: { enabled: true, volume: 0.6, success: "mission", fail: "faah" },
  plan: "grind75",
};

const store = () => chrome.storage.local;

/** False once the extension is reloaded under a still-open tab. */
export function storageAvailable(): boolean {
  try {
    return !!chrome.runtime?.id && !!chrome.storage?.local;
  } catch {
    return false;
  }
}

export function emptyRecord(slug: string): ProblemRecord {
  const now = Date.now();
  return {
    slug,
    id: "",
    title: slug,
    difficulty: "Medium",
    topics: [],
    firstSeen: now,
    lastSeen: now,
    solvedAt: null,
    timeSpentMs: 0,
    attempts: 0,
    failedAttempts: 0,
    session: { ms: 0, hints: 0, fails: 0, pasted: 0 },
    pendingRating: false,
    notes: { insight: "", body: "", time: "", space: "" },
    review: null,
    history: [],
    seenSubmissions: [],
  };
}

export async function getProblem(slug: string): Promise<ProblemRecord | null> {
  const key = PROBLEM_PREFIX + slug;
  const data = await store().get(key);
  return (data[key] as ProblemRecord | undefined) ?? null;
}

export async function getAllProblems(): Promise<ProblemRecord[]> {
  return getAllWithPrefix<ProblemRecord>(PROBLEM_PREFIX);
}

export async function getAllWithPrefix<T>(prefix: string): Promise<T[]> {
  const data = await store().get(null);
  return Object.entries(data)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, value]) => value as T);
}

export async function getValue<T>(key: string, fallback: T): Promise<T> {
  const data = await store().get(key);
  return (data[key] as T | undefined) ?? fallback;
}

export function setValue(key: string, value: unknown): Promise<void> {
  return store().set({ [key]: value });
}

export function removeValue(key: string): Promise<void> {
  return store().remove(key);
}

/** Read-modify-write any key through the same serialized queue. */
export function updateValue<T>(key: string, fallback: T, update: (value: T) => T): Promise<T> {
  return enqueue(async () => {
    const next = update(await getValue(key, fallback));
    await store().set({ [key]: next });
    return next;
  });
}

// Serialise read-modify-write cycles so concurrent updates (timer ticks,
// note autosave, verdicts) from the same page never clobber each other.
let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

export function updateProblem(
  slug: string,
  update: (record: ProblemRecord) => ProblemRecord
): Promise<ProblemRecord> {
  return enqueue(async () => {
    const current = (await getProblem(slug)) ?? emptyRecord(slug);
    const next = update(current);
    await store().set({ [PROBLEM_PREFIX + slug]: next });
    return next;
  });
}

/** Keeps the record's metadata in sync with LeetCode whenever a problem is opened. */
export function touchProblem(problem: Problem): Promise<ProblemRecord> {
  return updateProblem(problem.slug, (r) => ({
    ...r,
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    topics: problem.topics,
    lastSeen: Date.now(),
  }));
}

export async function getSettings(): Promise<Settings> {
  const data = await store().get(SETTINGS_KEY);
  const saved = (data[SETTINGS_KEY] ?? {}) as Partial<Settings>;
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    targets: { ...DEFAULT_SETTINGS.targets, ...saved.targets },
    sounds: { ...DEFAULT_SETTINGS.sounds, ...saved.sounds },
  };
}

export function saveSettings(patch: Partial<Settings>): Promise<void> {
  return enqueue(async () => {
    const current = await getSettings();
    await store().set({ [SETTINGS_KEY]: { ...current, ...patch } });
  });
}

export async function getActivity(): Promise<Activity> {
  const data = await store().get(ACTIVITY_KEY);
  return (data[ACTIVITY_KEY] ?? {}) as Activity;
}

export function bumpActivity(delta: Partial<DayActivity>, ts = Date.now()): Promise<void> {
  return enqueue(async () => {
    const activity = await getActivity();
    const key = dayKey(ts);
    const day = activity[key] ?? { solved: 0, reviewed: 0, timeMs: 0 };
    activity[key] = {
      solved: day.solved + (delta.solved ?? 0),
      reviewed: day.reviewed + (delta.reviewed ?? 0),
      timeMs: day.timeMs + (delta.timeMs ?? 0),
    };
    await store().set({ [ACTIVITY_KEY]: activity });
  });
}

export interface Backup {
  app: "leetgoat";
  version: 1;
  exportedAt: string;
  data: Record<string, unknown>;
}

export async function exportData(): Promise<Backup> {
  return {
    app: "leetgoat",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: await store().get(null),
  };
}

export async function importData(backup: unknown): Promise<number> {
  const b = backup as Partial<Backup> | null;
  if (!b || b.app !== "leetgoat" || typeof b.data !== "object" || !b.data) {
    throw new Error("That file isn't a LeetGoat backup.");
  }
  await store().set(b.data);
  return Object.keys(b.data).filter((k) => k.startsWith(PROBLEM_PREFIX)).length;
}

export function clearData(): Promise<void> {
  return store().clear();
}
