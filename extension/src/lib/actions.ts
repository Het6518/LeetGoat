import type { ProblemRecord, Rating } from "../types";
import { schedule } from "./srs";
import { bumpActivity, updateProblem } from "./storage";

const MAX_SEEN_SUBMISSIONS = 30;

export interface VerdictInput {
  accepted: boolean;
  text: string;
  submissionId: string | null;
}

/** Returns the updated record, or null if this submission was already counted. */
export async function recordVerdict(slug: string, verdict: VerdictInput): Promise<ProblemRecord | null> {
  let duplicate = false;
  const record = await updateProblem(slug, (r) => {
    if (verdict.submissionId && r.seenSubmissions.includes(verdict.submissionId)) {
      duplicate = true;
      return r;
    }
    const seenSubmissions = verdict.submissionId
      ? [...r.seenSubmissions, verdict.submissionId].slice(-MAX_SEEN_SUBMISSIONS)
      : r.seenSubmissions;

    // Compile errors are typos, not a failed idea — don't count them against you.
    if (verdict.text === "Compile Error") return { ...r, seenSubmissions };

    if (!verdict.accepted) {
      return {
        ...r,
        seenSubmissions,
        attempts: r.attempts + 1,
        failedAttempts: r.failedAttempts + 1,
        session: { ...r.session, fails: r.session.fails + 1 },
      };
    }
    return {
      ...r,
      seenSubmissions,
      attempts: r.attempts + 1,
      solvedAt: r.solvedAt ?? Date.now(),
      pendingRating: true,
    };
  });
  return duplicate ? null : record;
}

/** Manual fallback when the verdict wasn't detected, or for problems solved before installing. */
export function markSolved(slug: string) {
  return updateProblem(slug, (r) => ({
    ...r,
    solvedAt: r.solvedAt ?? Date.now(),
    pendingRating: true,
  }));
}

export async function rateProblem(slug: string, rating: Rating, sessionMs: number) {
  const now = Date.now();
  let firstTime = false;
  await updateProblem(slug, (r) => {
    firstTime = r.review === null;
    return {
      ...r,
      solvedAt: r.solvedAt ?? now,
      pendingRating: false,
      review: schedule(r.review, rating, now),
      history: [
        ...r.history,
        {
          at: now,
          rating,
          timeMs: sessionMs,
          hints: r.session.hints,
          fails: r.session.fails,
          pasted: r.session.pasted ?? 0,
        },
      ],
      session: { ms: 0, hints: 0, fails: 0, pasted: 0 },
    };
  });
  await bumpActivity(firstTime ? { solved: 1 } : { reviewed: 1 }, now);
}

export function dismissRating(slug: string) {
  return updateProblem(slug, (r) => ({ ...r, pendingRating: false }));
}

export function revealHint(slug: string, index: number) {
  return updateProblem(slug, (r) => ({
    ...r,
    session: { ...r.session, hints: Math.max(r.session.hints, index + 1) },
  }));
}

/** Code pasted in from outside LeetCode during this attempt. */
export function recordPaste(slug: string, chars: number) {
  return updateProblem(slug, (r) => ({
    ...r,
    session: { ...r.session, pasted: (r.session.pasted ?? 0) + chars },
  }));
}

export function removeFromDeck(slug: string) {
  return updateProblem(slug, (r) => ({ ...r, review: null, pendingRating: false }));
}
