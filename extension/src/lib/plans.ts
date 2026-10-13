import { fetchQuestionsMeta, type QuestionMeta } from "../api/leetcode";
import { PLANS, planSlugs, type StudyPlan } from "../data/plans";
import type { ProblemRecord } from "../types";
import { getValue, setValue } from "./storage";

export const PLAN_META_KEY = "planmeta";
const STALE_MS = 10 * 60_000;

export interface PlanMetaCache {
  at: number;
  items: Record<string, QuestionMeta>;
}

const ALL_PLAN_SLUGS = [...new Set(PLANS.flatMap(planSlugs))];

/**
 * One batched GraphQL request covers every plan problem's title, difficulty
 * and your solved status. Must run on leetcode.com (needs your session cookie).
 */
export async function refreshPlanMeta(force = false): Promise<PlanMetaCache> {
  const cached = await getValue<PlanMetaCache | null>(PLAN_META_KEY, null);
  if (!force && cached && Date.now() - cached.at < STALE_MS) return cached;
  const items = await fetchQuestionsMeta(ALL_PLAN_SLUGS);
  const next: PlanMetaCache = { at: Date.now(), items: Object.fromEntries(items.map((q) => [q.slug, q])) };
  await setValue(PLAN_META_KEY, next);
  return next;
}

export function isSolved(slug: string, meta: PlanMetaCache | null, records: Map<string, ProblemRecord>): boolean {
  return !!records.get(slug)?.solvedAt || meta?.items[slug]?.lcStatus === "ac";
}

export function titleFor(slug: string, meta: PlanMetaCache | null): string {
  return (
    meta?.items[slug]?.title ??
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export interface PlanProgress {
  solved: number;
  total: number;
  next: string | null;
  sections: { name: string; solved: number; total: number }[];
}

export function planProgress(plan: StudyPlan, meta: PlanMetaCache | null, records: Map<string, ProblemRecord>): PlanProgress {
  let next: string | null = null;
  const sections = plan.sections.map((section) => {
    const solved = section.slugs.filter((slug) => isSolved(slug, meta, records)).length;
    if (!next) {
      // Premium-only problems are skipped as "next" since most people can't open them.
      next = section.slugs.find((slug) => !isSolved(slug, meta, records) && !meta?.items[slug]?.isPaidOnly) ?? null;
    }
    return { name: section.name, solved, total: section.slugs.length };
  });
  return {
    solved: sections.reduce((sum, s) => sum + s.solved, 0),
    total: sections.reduce((sum, s) => sum + s.total, 0),
    next,
    sections,
  };
}
