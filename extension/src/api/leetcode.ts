import type { DailyChallenge, Difficulty, Problem, SimilarQuestion } from "../types";

const ENDPOINT = "https://leetcode.com/graphql/";

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const csrf = document.cookie.match(/csrftoken=([^;]+)/)?.[1];
  const response = await fetch(ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrf ? { "x-csrftoken": csrf } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) throw new Error(`LeetCode API responded ${response.status}`);
  const json = (await response.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  if (!json.data) throw new Error("Empty response from LeetCode");
  return json.data;
}

const QUESTION_QUERY = `
query leetgoatQuestion($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionFrontendId
    title
    titleSlug
    difficulty
    likes
    dislikes
    isPaidOnly
    status
    content
    hints
    stats
    similarQuestions
    topicTags { name slug }
  }
}`;

interface RawQuestion {
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  difficulty: Difficulty;
  likes: number;
  dislikes: number;
  isPaidOnly: boolean;
  status: string | null;
  content: string | null;
  hints: string[] | null;
  stats: string | null;
  similarQuestions: string | null;
  topicTags: { name: string; slug: string }[];
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeStatus(status: string | null): Problem["lcStatus"] {
  return status === "ac" || status === "notac" ? status : null;
}

export async function fetchProblem(slug: string): Promise<Problem> {
  const { question: q } = await gql<{ question: RawQuestion | null }>(QUESTION_QUERY, {
    titleSlug: slug,
  });
  if (!q) throw new Error(`Problem "${slug}" not found`);

  const stats = parseJson<{ acRate?: string; totalAccepted?: string; totalSubmission?: string }>(
    q.stats,
    {}
  );
  const similar = parseJson<
    { title: string; titleSlug: string; difficulty: Difficulty; isPaidOnly?: boolean }[]
  >(q.similarQuestions, []);

  return {
    id: q.questionFrontendId,
    slug: q.titleSlug,
    title: q.title,
    difficulty: q.difficulty,
    topics: q.topicTags.map((t) => ({ name: t.name, slug: t.slug })),
    likes: q.likes,
    dislikes: q.dislikes,
    acRate: stats.acRate ?? null,
    totalAccepted: stats.totalAccepted ?? null,
    totalSubmissions: stats.totalSubmission ?? null,
    hints: q.hints ?? [],
    similar: similar.map<SimilarQuestion>((s) => ({
      title: s.title,
      slug: s.titleSlug,
      difficulty: s.difficulty,
      isPaidOnly: !!s.isPaidOnly,
    })),
    content: q.content,
    isPaidOnly: q.isPaidOnly,
    lcStatus: normalizeStatus(q.status),
  };
}

const DAILY_QUERY = `
query leetgoatDaily {
  activeDailyCodingChallengeQuestion {
    date
    question { questionFrontendId title titleSlug difficulty status }
  }
}`;

export async function fetchDailyChallenge(): Promise<DailyChallenge> {
  const { activeDailyCodingChallengeQuestion: d } = await gql<{
    activeDailyCodingChallengeQuestion: {
      date: string;
      question: {
        questionFrontendId: string;
        title: string;
        titleSlug: string;
        difficulty: Difficulty;
        status: string | null;
      };
    };
  }>(DAILY_QUERY);

  return {
    date: d.date,
    id: d.question.questionFrontendId,
    slug: d.question.titleSlug,
    title: d.question.title,
    difficulty: d.question.difficulty,
    lcStatus: normalizeStatus(d.question.status),
  };
}

export const problemUrl = (slug: string) => `https://leetcode.com/problems/${slug}/`;
export const topicUrl = (slug: string) => `https://leetcode.com/tag/${slug}/`;

export interface QuestionMeta {
  slug: string;
  title: string;
  difficulty: Difficulty;
  isPaidOnly: boolean;
  lcStatus: "ac" | "notac" | null;
}

/** Title, difficulty and your status for many problems in a single request. */
export async function fetchQuestionsMeta(slugs: string[]): Promise<QuestionMeta[]> {
  if (!slugs.length) return [];
  const fields = slugs
    .map((slug, i) => `q${i}: question(titleSlug: ${JSON.stringify(slug)}) { titleSlug title difficulty isPaidOnly status }`)
    .join("\n");
  const data = await gql<Record<string, { titleSlug: string; title: string; difficulty: Difficulty; isPaidOnly: boolean; status: string | null } | null>>(
    `query leetgoatBatch {\n${fields}\n}`
  );
  return slugs.flatMap((_, i) => {
    const q = data[`q${i}`];
    return q
      ? [{ slug: q.titleSlug, title: q.title, difficulty: q.difficulty, isPaidOnly: q.isPaidOnly, lcStatus: normalizeStatus(q.status) }]
      : [];
  });
}

// ---- Contest replays (public) ----------------------------------------------

export interface ContestQuestion {
  slug: string;
  title: string;
  credit: number;
}

export async function fetchContestQuestions(contestSlug: string): Promise<ContestQuestion[]> {
  const res = await fetch(`https://leetcode.com/contest/api/info/${contestSlug}/`, { credentials: "include" });
  if (!res.ok) throw new Error(`Contest "${contestSlug}" not found (${res.status})`);
  const json = (await res.json()) as { questions?: { title: string; title_slug: string; credit: number }[] };
  return (json.questions ?? []).map((q) => ({ slug: q.title_slug, title: q.title, credit: q.credit }));
}

export interface ReplayEvent {
  /** "7" edit, "10" external paste, "5" submit, "4" run, "0"/"2" open & language. */
  eventType: string;
  eventData: string;
  timestamp: string;
}

/** LeetCode's Code Replay events for one account, for several problems in one request. */
export async function fetchReplayEvents(
  contestSlug: string,
  questionSlugs: string[],
  username: string
): Promise<(ReplayEvent[] | null)[]> {
  if (!questionSlugs.length) return [];
  const fields = questionSlugs
    .map(
      (slug, i) =>
        `q${i}: userContestReplayEvents(contestSlug: $contest, questionSlug: ${JSON.stringify(slug)}, username: $username) { eventType eventData timestamp }`
    )
    .join("\n");
  const data = await gql<Record<string, ReplayEvent[] | null>>(
    `query leetgoatReplays($contest: String!, $username: String!) {\n${fields}\n}`,
    { contest: contestSlug, username }
  );
  return questionSlugs.map((_, i) => data[`q${i}`] ?? null);
}

export interface ContestHistoryEntry {
  title: string;
  startTime: number;
  rating: number;
  ranking: number;
  problemsSolved: number;
  totalProblems: number;
  finishTimeInSeconds: number;
}

/** Every rated contest an account attended, oldest first. Public data. */
export async function fetchContestHistory(username: string): Promise<ContestHistoryEntry[]> {
  const { userContestRankingHistory } = await gql<{
    userContestRankingHistory:
      | {
          attended: boolean;
          rating: number;
          ranking: number;
          problemsSolved: number;
          totalProblems: number;
          finishTimeInSeconds: number;
          contest: { title: string; startTime: number };
        }[]
      | null;
  }>(
    `query leetgoatHistory($username: String!) {
      userContestRankingHistory(username: $username) {
        attended rating ranking problemsSolved totalProblems finishTimeInSeconds
        contest { title startTime }
      }
    }`,
    { username }
  );
  return (userContestRankingHistory ?? [])
    .filter((h) => h.attended)
    .map((h) => ({
      title: h.contest.title,
      startTime: h.contest.startTime,
      rating: h.rating,
      ranking: h.ranking,
      problemsSolved: h.problemsSolved,
      totalProblems: h.totalProblems,
      finishTimeInSeconds: h.finishTimeInSeconds,
    }));
}
