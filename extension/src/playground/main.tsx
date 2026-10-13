/**
 * Dev playground: renders the real sidebar + popup outside Chrome with an
 * in-memory chrome.storage and canned LeetCode responses.
 * Run `npm run dev` and open /playground.html.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DAY } from "../lib/dates";
import { emptyRecord } from "../lib/storage";
import type { ProblemRecord } from "../types";
import "../styles/content.css";

// ---- chrome.* mock -------------------------------------------------------
type Listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => void;
const data: Record<string, unknown> = {};
const listeners = new Set<Listener>();

const local = {
  async get(keys: string | null) {
    if (keys === null) return structuredClone(data);
    return keys in data ? { [keys]: structuredClone(data[keys]) } : {};
  },
  async set(items: Record<string, unknown>) {
    const changes: Record<string, chrome.storage.StorageChange> = {};
    for (const [k, v] of Object.entries(items)) {
      changes[k] = { oldValue: data[k], newValue: structuredClone(v) };
      data[k] = structuredClone(v);
    }
    listeners.forEach((l) => l(changes, "local"));
  },
  async clear() {
    for (const k of Object.keys(data)) delete data[k];
  },
};

(globalThis as unknown as { chrome: unknown }).chrome = {
  runtime: { id: "playground", onMessage: { addListener() {}, removeListener() {} } },
  storage: {
    local,
    onChanged: {
      addListener: (l: Listener) => listeners.add(l),
      removeListener: (l: Listener) => listeners.delete(l),
    },
  },
  tabs: { query: async () => [], create: async () => undefined, update: async () => undefined },
};

// ---- seed data -----------------------------------------------------------
const now = Date.now();
function seed(slug: string, title: string, difficulty: ProblemRecord["difficulty"], topics: string[], extra: Partial<ProblemRecord>) {
  data[`p:${slug}`] = {
    ...emptyRecord(slug),
    id: String(Math.floor(Math.random() * 2000)),
    title,
    difficulty,
    topics: topics.map((t) => ({ name: t, slug: t.toLowerCase().replace(/\s+/g, "-") })),
    solvedAt: now - 10 * DAY,
    timeSpentMs: 25 * 60_000,
    ...extra,
  };
}
seed("3sum", "3Sum", "Medium", ["Array", "Two Pointers", "Sorting"], {
  review: { interval: 4, ease: 2.5, reps: 1, lapses: 0, due: now - 2 * DAY },
  history: [{ at: now - 6 * DAY, rating: "good", timeMs: 22 * 60_000, hints: 0, fails: 1 }],
  notes: { insight: "Sort, fix i, two-pointer the rest; skip duplicates", body: "", time: "O(n²)", space: "O(1)" },
});
seed("coin-change", "Coin Change", "Medium", ["Array", "Dynamic Programming"], {
  review: { interval: 2, ease: 2.3, reps: 1, lapses: 0, due: now - 1000 },
  history: [{ at: now - 2 * DAY, rating: "hard", timeMs: 41 * 60_000, hints: 1, fails: 2 }],
});
seed("trapping-rain-water", "Trapping Rain Water", "Hard", ["Array", "Two Pointers", "Stack", "Dynamic Programming"], {
  review: { interval: 1, ease: 2.3, reps: 0, lapses: 1, due: now + DAY },
  history: [{ at: now - DAY, rating: "again", timeMs: 50 * 60_000, hints: 2, fails: 3 }],
});
seed("valid-anagram", "Valid Anagram", "Easy", ["Hash Table", "String", "Sorting"], {
  review: { interval: 7, ease: 2.65, reps: 1, lapses: 0, due: now + 4 * DAY },
  history: [{ at: now - 3 * DAY, rating: "easy", timeMs: 6 * 60_000, hints: 0, fails: 0 }],
});
const activity: Record<string, { solved: number; reviewed: number; timeMs: number }> = {};
for (let i = 0; i < 110; i++) {
  if (Math.random() < 0.45 && i !== 1) continue;
  const d = new Date(now - i * DAY);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  activity[key] = { solved: Math.ceil(Math.random() * 3), reviewed: Math.floor(Math.random() * 3), timeMs: 40 * 60_000 };
}
data.activity = activity;

// ---- LeetCode API mock ---------------------------------------------------
const TWO_SUM_CONTENT = `<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices of the two numbers such that they add up to <code>target</code></em>.</p>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>2 &lt;= nums.length &lt;= 10<sup>4</sup></code></li>
<li><code>-10<sup>9</sup> &lt;= nums[i] &lt;= 10<sup>9</sup></code></li>
<li><code>-10<sup>9</sup> &lt;= target &lt;= 10<sup>9</sup></code></li>
<li><strong>Only one valid answer exists.</strong></li>
</ul>
<p>&nbsp;</p>
<strong>Follow-up:&nbsp;</strong>Can you come up with an algorithm that is less than <code>O(n<sup>2</sup>)</code><font face="monospace">&nbsp;</font>time complexity?`;

window.fetch = async (_input, init) => {
  const body = JSON.parse(String(init?.body ?? "{}")) as { query: string };
  await new Promise((r) => setTimeout(r, 300));
  if (body.query.includes("activeDailyCodingChallengeQuestion")) {
    return Response.json({
      data: {
        activeDailyCodingChallengeQuestion: {
          date: "2026-10-12",
          question: { questionFrontendId: "1971", title: "Find if Path Exists in Graph", titleSlug: "find-if-path-exists-in-graph", difficulty: "Easy", status: null },
        },
      },
    });
  }
  return Response.json({
    data: {
      question: {
        questionFrontendId: "1",
        title: "Two Sum",
        titleSlug: "two-sum",
        difficulty: "Easy",
        likes: 61234,
        dislikes: 2150,
        isPaidOnly: false,
        status: "notac",
        content: TWO_SUM_CONTENT,
        hints: [
          "A really brute force way would be to search for all possible pairs of numbers but that would be too slow.",
          "So, if we fix one of the numbers, say <code>x</code>, we have to scan the entire array to find the next number <code>y</code> which is <code>value - x</code>.",
          "Can we use a hash map to speed up the search?",
        ],
        stats: JSON.stringify({ acRate: "55.2%", totalAccepted: "15.1M", totalSubmission: "27.4M" }),
        similarQuestions: JSON.stringify([
          { title: "3Sum", titleSlug: "3sum", difficulty: "Medium" },
          { title: "4Sum", titleSlug: "4sum", difficulty: "Medium" },
          { title: "Two Sum II - Input Array Is Sorted", titleSlug: "two-sum-ii-input-array-is-sorted", difficulty: "Medium" },
          { title: "Two Sum III - Data structure design", titleSlug: "two-sum-iii-data-structure-design", difficulty: "Easy", isPaidOnly: true },
        ]),
        topicTags: [
          { name: "Array", slug: "array" },
          { name: "Hash Table", slug: "hash-table" },
        ],
      },
    },
  });
};

// ---- render --------------------------------------------------------------
history.replaceState(null, "", "/problems/two-sum/description/");
const params = new URLSearchParams(location.search);

async function start() {
  const { default: App } = await import("../content/App");
  const { default: Popup } = await import("../popup/Popup");
  if (params.get("dark") === "1") document.documentElement.classList.add("dark");

  createRoot(document.getElementById("app")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  createRoot(document.getElementById("popup")!).render(
    <StrictMode>
      <div className="lg-theme">
        <Popup />
      </div>
    </StrictMode>
  );
}
void start();
