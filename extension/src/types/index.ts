export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Topic {
  name: string;
  slug: string;
}

export interface SimilarQuestion {
  title: string;
  slug: string;
  difficulty: Difficulty;
  isPaidOnly: boolean;
}

/** Live problem data fetched from LeetCode. */
export interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  topics: Topic[];
  likes: number;
  dislikes: number;
  acRate: string | null;
  totalAccepted: string | null;
  totalSubmissions: string | null;
  hints: string[];
  similar: SimilarQuestion[];
  content: string | null;
  isPaidOnly: boolean;
  /** "ac" = solved, "notac" = attempted, null = untouched or signed out. */
  lcStatus: "ac" | "notac" | null;
}

export interface DailyChallenge {
  date: string;
  slug: string;
  id: string;
  title: string;
  difficulty: Difficulty;
  lcStatus: "ac" | "notac" | null;
}

export type Rating = "again" | "hard" | "good" | "easy";

export interface ReviewState {
  /** Days until the next review. */
  interval: number;
  ease: number;
  reps: number;
  lapses: number;
  due: number;
}

export interface ReviewEvent {
  at: number;
  rating: Rating;
  timeMs: number;
  hints: number;
  fails: number;
  pasted?: number;
}

export interface Notes {
  insight: string;
  body: string;
  time: string;
  space: string;
}

/** The attempt currently in progress — reset after each rating. */
export interface Session {
  ms: number;
  hints: number;
  fails: number;
  /** Characters pasted into the editor from outside LeetCode this attempt. */
  pasted?: number;
}

/** Everything LeetGoat remembers about one problem. */
export interface ProblemRecord {
  slug: string;
  id: string;
  title: string;
  difficulty: Difficulty;
  topics: Topic[];
  firstSeen: number;
  lastSeen: number;
  solvedAt: number | null;
  timeSpentMs: number;
  attempts: number;
  failedAttempts: number;
  session: Session;
  /** Accepted, waiting for the user to rate how it went. */
  pendingRating: boolean;
  notes: Notes;
  review: ReviewState | null;
  history: ReviewEvent[];
  seenSubmissions: string[];
}

export type ThemeSetting = "auto" | "light" | "dark";

export type SuccessSound = "mission" | "chime" | "custom" | "none";
export type FailSound = "faah" | "buzzer" | "custom" | "none";

export interface SoundSettings {
  enabled: boolean;
  volume: number;
  success: SuccessSound;
  fail: FailSound;
}

export interface Settings {
  dailyGoal: number;
  theme: ThemeSetting;
  autoTimer: boolean;
  hideTopics: boolean;
  blindMode: boolean;
  trackPastes: boolean;
  targets: Record<Difficulty, number>;
  sounds: SoundSettings;
  plan: "grind75" | "neetcode150" | "blind75";
}

export interface Snippet {
  id: string;
  title: string;
  /** Monaco language id ("python", "cpp", "java", …) or "any". */
  lang: string;
  code: string;
  builtIn?: boolean;
}

export interface DayActivity {
  solved: number;
  reviewed: number;
  timeMs: number;
}

export type Activity = Record<string, DayActivity>;
