import { useMemo } from "react";
import { CalendarClock, Crosshair, Map as MapIcon, Moon, Settings as SettingsIcon, ShieldAlert, Sun, TriangleAlert, X } from "lucide-react";
import type { Problem, ProblemRecord, Rating, Settings } from "../types";
import type { Timer } from "../hooks/useTimer";
import { isDue } from "../hooks/useTimer";
import { MINUTE } from "../lib/dates";
import { cn } from "../lib/utils";
import { dismissRating, markSolved, rateProblem, revealHint } from "../lib/actions";
import { problemUrl } from "../api/leetcode";
import { Button, Card, Empty, GoatMark, IconButton } from "../components/ui";
import ProblemHeader from "../components/solve/ProblemHeader";
import RatePrompt from "../components/solve/RatePrompt";
import TimerCard from "../components/solve/TimerCard";
import { ConstraintsCard, HintsCard, SimilarCard } from "../components/solve/InsightCards";
import ReviewList from "../components/shared/ReviewList";
import { dueRecords } from "../lib/deck";
import SettingsPanel from "../components/shared/SettingsPanel";
import PlanPanel from "../components/plan/PlanPanel";
import AccountPanel from "../components/contest/AccountPanel";

export type Tab = "solve" | "plan" | "review" | "check" | "settings";

interface Props {
  open: boolean;
  onClose: () => void;
  tab: Tab;
  onTab: (tab: Tab) => void;
  dark: boolean;
  slug: string | null;
  profileSlug: string | null;
  checkToken: number;
  problem: Problem | null;
  problemError: string | null;
  record: ProblemRecord | null | undefined;
  records: ProblemRecord[];
  settings: Settings;
  onSettings: (patch: Partial<Settings>) => void;
  timer: Timer;
}

function SolveTab({ slug: maybeSlug, problem, problemError, record, records, settings, timer }: Props) {
  const slug = maybeSlug ?? "";
  const recordMap = useMemo(() => new Map(records.map((r) => [r.slug, r])), [records]);

  if (problemError) {
    return (
      <Empty icon={<Crosshair />} title="Couldn't load this problem">
        {problemError}. Try refreshing the page.
      </Empty>
    );
  }
  if (!problem) {
    return (
      <div className="space-y-3">
        {[96, 120, 160].map((h) => (
          <div key={h} className="animate-pulse rounded-xl bg-raised" style={{ height: h }} />
        ))}
      </div>
    );
  }

  const targetMin = settings.targets[problem.difficulty];
  const due = isDue(record);

  const rate = (rating: Rating) => {
    void rateProblem(slug, rating, timer.elapsedMs).then(timer.reset);
  };

  // Solved on LeetCode before installing — offer to pull it into the deck.
  const canImport = problem.lcStatus === "ac" && !record?.review && !record?.pendingRating;

  return (
    <div className="space-y-3">
      <ProblemHeader problem={problem} record={record} hideTopics={settings.hideTopics} />

      {record?.pendingRating && (
        <RatePrompt
          record={record}
          sessionMs={timer.elapsedMs}
          targetMs={targetMin * MINUTE}
          onRate={rate}
          onDismiss={() => void dismissRating(slug)}
        />
      )}

      {due && !record?.pendingRating && (
        <div className="lg-pop flex gap-3 rounded-xl border border-accent/40 bg-accent-soft p-3.5">
          <CalendarClock className="mt-0.5 size-4 shrink-0 text-accent" />
          <div className="text-sm">
            <div className="font-semibold">Review time</div>
            <div className="text-xs text-muted">
              Solve it from scratch without peeking at your old solution.
            </div>
          </div>
        </div>
      )}

      {(record?.session.pasted ?? 0) > 0 && !record?.pendingRating && (
        <div className="flex gap-2.5 rounded-xl border border-medium/40 bg-medium/8 p-3 text-xs">
          <TriangleAlert className="mt-px size-3.5 shrink-0 text-medium" />
          <span>
            <span className="font-semibold">{record?.session.pasted} chars pasted from outside</span>
            <span className="text-muted"> this attempt — your rating will reflect it.</span>
          </span>
        </div>
      )}

      {canImport && (
        <Card>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 text-xs text-muted">
              You've solved this on LeetCode before. Add it to your review deck so it doesn't fade.
            </div>
            <Button size="sm" variant="primary" onClick={() => void markSolved(slug)}>
              Add to deck
            </Button>
          </div>
        </Card>
      )}

      <TimerCard
        timer={timer}
        targetMin={targetMin}
        hasHints={problem.hints.length > 0}
        solved={!!record?.pendingRating || (!!record?.solvedAt && !due)}
        onMarkSolved={() => {
          timer.pause();
          void markSolved(slug);
        }}
      />

      {problem.isPaidOnly && !problem.content ? null : <ConstraintsCard problem={problem} />}

      <HintsCard
        hints={problem.hints}
        revealed={record?.session.hints ?? 0}
        onReveal={(i) => void revealHint(slug, i)}
      />

      <SimilarCard similar={problem.similar} records={recordMap} />
    </div>
  );
}

const TABS: { id: Exclude<Tab, "settings">; label: string; icon: React.ReactNode; on: "problem" | "other" | "both" }[] = [
  { id: "solve", label: "Solve", icon: <Crosshair />, on: "problem" },
  { id: "plan", label: "Plan", icon: <MapIcon />, on: "both" },
  { id: "review", label: "Review", icon: <CalendarClock />, on: "both" },
  // No cheat-checking while you're solving — it lives on every other page.
  { id: "check", label: "Cheat check", icon: <ShieldAlert />, on: "other" },
];

const openProblem = (slug: string) => {
  window.location.href = problemUrl(slug);
};

export default function Sidebar(props: Props) {
  const { open, onClose, tab, onTab, dark, slug, profileSlug, checkToken, records, settings, onSettings } = props;
  const dueCount = useMemo(() => dueRecords(records).length, [records]);

  const tabs = TABS.filter((t) => t.on === "both" || (t.on === "problem") === !!slug);

  return (
    <aside
      aria-hidden={!open}
      inert={!open}
      className={cn(
        "fixed top-0 right-0 z-[2147483001] flex h-dvh w-[400px] max-w-[100vw] flex-col border-l border-line bg-canvas text-fg shadow-2xl shadow-black/25 transition-[translate,visibility] duration-250 ease-out",
        open ? "visible translate-x-0" : "invisible translate-x-full"
      )}
    >
      <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-line bg-surface px-4">
        <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-fg">
          <GoatMark className="size-4.5" />
        </span>
        <div className="leading-tight">
          <div className="text-base font-semibold">LeetGoat</div>
          <div className="text-2xs text-faint">Practice that sticks</div>
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          <IconButton
            label={dark ? "Light theme" : "Dark theme"}
            onClick={() => onSettings({ theme: dark ? "light" : "dark" })}
          >
            {dark ? <Sun /> : <Moon />}
          </IconButton>
          <IconButton
            label="Settings"
            onClick={() => onTab(tab === "settings" ? (slug ? "solve" : "plan") : "settings")}
            className={tab === "settings" ? "bg-raised text-fg" : undefined}
          >
            <SettingsIcon />
          </IconButton>
          <IconButton label="Close (Alt+G)" onClick={onClose}>
            <X />
          </IconButton>
        </div>
      </header>

      <nav className="flex shrink-0 border-b border-line bg-surface px-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTab(t.id)}
            className={cn(
              "relative flex h-12 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-2xs font-medium transition-colors [&>svg]:size-4",
              tab === t.id ? "text-fg" : "text-muted hover:text-fg"
            )}
          >
            {t.icon}
            <span className="truncate">{t.label}</span>
            {t.id === "review" && dueCount > 0 && (
              <span className="absolute top-1 right-[calc(50%-18px)] grid h-3.5 min-w-3.5 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-fg">
                {dueCount}
              </span>
            )}
            {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
          </button>
        ))}
      </nav>

      <main className="lg-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        {tab === "solve" && slug && <SolveTab {...props} />}
        {tab === "plan" && (
          <PlanPanel
            settings={settings}
            onSettings={onSettings}
            records={records}
            currentSlug={slug}
            onOpen={(s) => (s === slug ? onTab("solve") : openProblem(s))}
            canRefresh
          />
        )}
        {tab === "check" && !slug && <AccountPanel key={profileSlug ?? "none"} defaultUser={profileSlug} runToken={checkToken} />}
        {tab === "review" && (
          <ReviewList
            records={records}
            currentSlug={slug}
            onOpen={(s) => (s === slug ? onTab("solve") : openProblem(s))}
          />
        )}
        {tab === "settings" && <SettingsPanel settings={settings} onChange={onSettings} />}
      </main>

    </aside>
  );
}
