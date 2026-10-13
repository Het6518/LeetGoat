import type { Rating, ReviewState } from "../types";
import { addDays } from "./dates";

export const RATINGS: { id: Rating; label: string; hint: string }[] = [
  { id: "again", label: "Needed help", hint: "Couldn't solve it without the solution" },
  { id: "hard", label: "Struggled", hint: "Got there, but slowly or with hints" },
  { id: "good", label: "Solid", hint: "Solved with a reasonable effort" },
  { id: "easy", label: "Easy", hint: "Knew the approach right away" },
];

export const RATING_SCORE: Record<Rating, number> = { again: 0, hard: 1, good: 2, easy: 3 };

const MAX_INTERVAL = 365;
const MIN_EASE = 1.3;

/** Days until next review — an SM-2 variant tuned for algorithm problems. */
export function nextInterval(prev: ReviewState | null, rating: Rating): number {
  const reps = prev?.reps ?? 0;
  const interval = prev?.interval ?? 0;
  const ease = prev?.ease ?? 2.5;

  let days: number;
  switch (rating) {
    case "again":
      days = 1;
      break;
    case "hard":
      days = reps === 0 ? 2 : Math.max(interval + 1, Math.round(interval * 1.2));
      break;
    case "good":
      days = reps === 0 ? 4 : reps === 1 ? 10 : Math.max(interval + 1, Math.round(interval * ease));
      break;
    case "easy":
      days = reps === 0 ? 7 : Math.max(interval + 2, Math.round(interval * ease * 1.3));
      break;
  }
  return Math.min(days, MAX_INTERVAL);
}

export function schedule(prev: ReviewState | null, rating: Rating, now = Date.now()): ReviewState {
  const interval = nextInterval(prev, rating);
  let ease = prev?.ease ?? 2.5;
  if (rating === "again") ease -= 0.2;
  if (rating === "hard") ease -= 0.15;
  if (rating === "easy") ease += 0.15;

  return {
    interval,
    ease: Math.max(MIN_EASE, Number(ease.toFixed(2))),
    reps: rating === "again" ? 0 : (prev?.reps ?? 0) + 1,
    lapses: (prev?.lapses ?? 0) + (rating === "again" ? 1 : 0),
    due: addDays(now, interval),
  };
}

/** Pre-selects a rating from what actually happened during the attempt. */
export function suggestRating(opts: {
  timeMs: number;
  targetMs: number;
  hints: number;
  fails: number;
  pasted?: number;
}): Rating | null {
  const { timeMs, targetMs, hints, fails, pasted = 0 } = opts;
  // A big outside paste means the solution wasn't yours yet.
  if (pasted >= 200) return "again";
  if (timeMs < 30_000 && hints === 0 && fails === 0) return null;
  if (hints > 0 || fails >= 3 || timeMs > targetMs * 1.75) return "hard";
  if (fails === 0 && timeMs < targetMs * 0.5) return "easy";
  return "good";
}
