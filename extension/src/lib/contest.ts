import {
  fetchContestHistory,
  fetchContestQuestions,
  fetchReplayEvents,
  type ContestQuestion,
  type ReplayEvent,
} from "../api/leetcode";

/**
 * Account cheat check, based purely on LeetCode's own Code Replay data.
 *
 * During contests LeetCode records editor events for every problem. Event
 * type 10 is an "External Paste" — text pasted into the editor from outside
 * LeetCode — and it includes what was pasted. We flag a problem when a paste
 * is larger than LeetCode's own threshold (200 chars). Nothing else counts.
 */

const EVENT_EDIT = "7";
const EVENT_SUBMIT = "5";
const EVENT_PASTE = "10";
/** LeetCode's replay UI marks pastes as "size > 200 chars". */
export const PASTE_FLAG_CHARS = 200;

export type ProblemVerdict = "pasted" | "snippet" | "clean" | "nodata";
export type ContestVerdict = ProblemVerdict;

export interface Paste {
  at: number;
  chars: number;
  text: string;
}

export interface ProblemReplay {
  title: string;
  slug: string;
  credit: number;
  pastes: Paste[];
  largestPaste: number;
  edits: number;
  submittedAt: number | null;
  accepted: boolean;
  /** Seconds between the big paste and the next submission. */
  pasteToSubmitSec: number | null;
  verdict: ProblemVerdict;
}

export interface ContestReport {
  title: string;
  slug: string;
  startTime: number;
  rating: number;
  ratingDelta: number | null;
  solved: number;
  total: number;
  problems: ProblemReplay[];
  verdict: ContestVerdict;
}

export interface AccountReport {
  username: string;
  contests: ContestReport[];
  pastedContests: number;
  checkedContests: number;
  /** "cheater": pasted in at least half of the contests taken. */
  verdict: "cheater" | "clean" | "nodata";
  summary: string;
}

export function contestSlug(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, "-");
}

export function formatGap(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m ? `${m}m ${s}s` : `${s}s`;
}

function parse(event: ReplayEvent): Record<string, unknown> {
  try {
    return JSON.parse(event.eventData) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function analyzeProblem(q: ContestQuestion, events: ReplayEvent[] | null): ProblemReplay {
  const base = { title: q.title, slug: q.slug, credit: q.credit };
  if (!events || events.length === 0) {
    return { ...base, pastes: [], largestPaste: 0, edits: 0, submittedAt: null, accepted: false, pasteToSubmitSec: null, verdict: "nodata" };
  }

  const sorted = [...events].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  const pastes: Paste[] = [];
  let edits = 0;
  let submittedAt: number | null = null;
  let accepted = false;
  const submits: number[] = [];

  for (const e of sorted) {
    const at = Date.parse(e.timestamp) / 1000;
    if (e.eventType === EVENT_EDIT) edits++;
    if (e.eventType === EVENT_PASTE) {
      const changes = (parse(e).changes as { insert?: string }[] | undefined) ?? [];
      const text = changes.map((c) => c.insert ?? "").join("\n");
      pastes.push({ at, chars: text.length, text });
    }
    if (e.eventType === EVENT_SUBMIT) {
      submits.push(at);
      submittedAt = at;
      if ((parse(e).result as { status?: number } | undefined)?.status === 10) accepted = true;
    }
  }

  const largest = pastes.reduce((m, p) => (p.chars > m.chars ? p : m), { at: 0, chars: 0, text: "" });
  const nextSubmit = largest.chars ? submits.find((t) => t >= largest.at) : undefined;

  return {
    ...base,
    pastes,
    largestPaste: largest.chars,
    edits,
    submittedAt,
    accepted,
    pasteToSubmitSec: nextSubmit !== undefined ? Math.round(nextSubmit - largest.at) : null,
    verdict: largest.chars > PASTE_FLAG_CHARS ? "pasted" : pastes.length ? "snippet" : "clean",
  };
}

const RANK: Record<ProblemVerdict, number> = { nodata: 0, clean: 1, snippet: 2, pasted: 3 };

async function pool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(limit, queue.length) }, async () => {
      while (queue.length) await worker(queue.shift()!);
    })
  );
}

export async function scanAccount(
  username: string,
  limit: number,
  onProgress: (label: string, done: number, total: number) => void
): Promise<AccountReport> {
  onProgress("Loading contest history", 0, 1);
  const history = await fetchContestHistory(username);
  if (!history.length) {
    return { username, contests: [], pastedContests: 0, checkedContests: 0, verdict: "nodata", summary: "No rated contests yet." };
  }

  const recent = history
    .map((entry, i) => ({ entry, ratingDelta: i > 0 ? Math.round(entry.rating - history[i - 1].rating) : null }))
    .slice(-limit);

  const contests: ContestReport[] = [];
  let done = 0;
  onProgress("Reading code replays", 0, recent.length);
  await pool(recent, 4, async ({ entry, ratingDelta }) => {
    const slug = contestSlug(entry.title);
    let problems: ProblemReplay[];
    try {
      const questions = await fetchContestQuestions(slug);
      const events = await fetchReplayEvents(slug, questions.map((q) => q.slug), username);
      problems = questions.map((q, i) => analyzeProblem(q, events[i]));
    } catch {
      problems = [];
    }
    const verdict = problems.reduce<ContestVerdict>((v, p) => (RANK[p.verdict] > RANK[v] ? p.verdict : v), "nodata");
    contests.push({
      title: entry.title,
      slug,
      startTime: entry.startTime,
      rating: Math.round(entry.rating),
      ratingDelta,
      solved: entry.problemsSolved,
      total: entry.totalProblems,
      problems,
      verdict,
    });
    onProgress("Reading code replays", ++done, recent.length);
  });
  contests.sort((a, b) => b.startTime - a.startTime);

  const taken = contests.length;
  const checked = contests.filter((c) => c.verdict !== "nodata").length;
  const pasted = contests.filter((c) => c.verdict === "pasted").length;
  const pastedLine = `External paste over ${PASTE_FLAG_CHARS} chars in ${pasted} of ${taken} contests taken.`;
  return {
    username,
    contests,
    pastedContests: pasted,
    checkedContests: checked,
    verdict: !checked ? "nodata" : pasted >= taken / 2 ? "cheater" : "clean",
    summary: !checked
      ? "No code replay data — LeetCode only records it for recent contests solved in its own editor."
      : pasted
        ? pastedLine
        : `No large external pastes in ${checked} contests with replay data.`,
  };
}

export function profileSlugFromPath(pathname = window.location.pathname): string | null {
  return pathname.match(/^\/u\/([^/]+)/)?.[1] ?? null;
}
