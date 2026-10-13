import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, CircleCheck, Circle, Lock, Map as MapIcon, RefreshCw } from "lucide-react";
import type { ProblemRecord, Settings } from "../../types";
import { PLANS, getPlan } from "../../data/plans";
import { isSolved, planProgress, titleFor } from "../../lib/plans";
import { usePlanMeta } from "../../hooks/usePlanMeta";
import { cn } from "../../lib/utils";
import { Button, Card, DifficultyDot, IconButton, ProgressBar, Ring } from "../ui";

export default function PlanPanel({
  settings,
  onSettings,
  records,
  currentSlug,
  onOpen,
  canRefresh,
}: {
  settings: Settings;
  onSettings: (patch: Partial<Settings>) => void;
  records: ProblemRecord[];
  currentSlug?: string | null;
  onOpen: (slug: string) => void;
  /** Only on leetcode.com can we read your solved status. */
  canRefresh: boolean;
}) {
  const plan = getPlan(settings.plan);
  const { meta, refreshing, refresh } = usePlanMeta(canRefresh);
  const recordMap = useMemo(() => new Map(records.map((r) => [r.slug, r])), [records]);
  const progress = planProgress(plan, meta, recordMap);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const currentSection = plan.sections.find((s) => s.slugs.includes(currentSlug ?? ""))?.name;
  const nextSection = plan.sections.find((s) => s.slugs.includes(progress.next ?? ""))?.name;
  const expanded = openSection ?? currentSection ?? nextSection ?? null;

  return (
    <div className="space-y-3">
      <Card
        title="Study plan"
        icon={<MapIcon />}
        action={
          canRefresh && (
            <IconButton label="Refresh solved status" onClick={() => refresh(true)} className="size-7">
              <RefreshCw className={cn(refreshing && "animate-spin")} />
            </IconButton>
          )
        }
      >
        <div className="mb-3 flex flex-wrap gap-1.5">
          {PLANS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onSettings({ plan: p.id });
                setOpenSection(null);
              }}
              className={cn(
                "h-7 cursor-pointer rounded-lg border px-2.5 text-xs font-medium transition-colors",
                p.id === plan.id ? "border-accent bg-accent-soft text-accent" : "border-line text-muted hover:text-fg"
              )}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Ring value={progress.solved / progress.total} size={52} stroke={5}>
            <span className="text-2xs">{Math.round((progress.solved / progress.total) * 100)}%</span>
          </Ring>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">
              {progress.solved} / {progress.total} solved
            </div>
            <div className="text-xs text-muted">{plan.blurb}</div>
          </div>
        </div>

        {progress.next ? (
          <Button variant="primary" className="mt-3 w-full justify-between" onClick={() => onOpen(progress.next!)}>
            <span className="truncate">Next: {titleFor(progress.next, meta)}</span>
            <ArrowRight />
          </Button>
        ) : (
          <p className="mt-3 text-sm font-medium text-easy">Plan complete. 🐐</p>
        )}
        {!meta && !canRefresh && (
          <p className="mt-2 text-2xs text-faint">Open any LeetCode page once to sync your solved problems.</p>
        )}
      </Card>

      <ul className="space-y-1.5">
        {plan.sections.map((section, i) => {
          const s = progress.sections[i];
          const isOpen = expanded === section.name;
          return (
            <li key={section.name} className="rounded-xl border border-line bg-surface">
              <button
                type="button"
                onClick={() => setOpenSection(isOpen ? "" : section.name)}
                className="flex w-full cursor-pointer items-center gap-3 px-3.5 py-2.5 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{section.name}</span>
                    <span className="shrink-0 text-2xs text-faint">
                      {s.solved}/{s.total}
                    </span>
                  </div>
                  <ProgressBar value={s.solved / s.total} className="mt-1.5 h-1" barClassName={s.solved === s.total ? "bg-easy" : undefined} />
                </div>
                <ChevronDown className={cn("size-3.5 shrink-0 text-faint transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <ul className="border-t border-line px-1.5 py-1.5">
                  {section.slugs.map((slug) => {
                    const done = isSolved(slug, meta, recordMap);
                    const info = meta?.items[slug];
                    return (
                      <li key={slug}>
                        <button
                          type="button"
                          onClick={() => onOpen(slug)}
                          className={cn(
                            "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-raised",
                            slug === currentSlug && "bg-raised",
                            slug === progress.next && "ring-1 ring-accent/50"
                          )}
                        >
                          {done ? (
                            <CircleCheck className="size-3.5 shrink-0 text-easy" />
                          ) : (
                            <Circle className="size-3.5 shrink-0 text-faint" />
                          )}
                          <span className={cn("min-w-0 flex-1 truncate", done && "text-muted")}>{titleFor(slug, meta)}</span>
                          {info?.isPaidOnly && <Lock className="size-3 text-faint" />}
                          {info && <DifficultyDot difficulty={info.difficulty} />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
