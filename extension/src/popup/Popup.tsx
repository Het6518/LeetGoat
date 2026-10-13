import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CalendarDays, CircleCheck, Map as MapIcon, Settings as SettingsIcon } from "lucide-react";
import type { DailyChallenge } from "../types";
import { fetchDailyChallenge, problemUrl } from "../api/leetcode";
import { cn } from "../lib/utils";
import { useAllProblems, useSettings } from "../hooks/useStorage";
import PlanPanel from "../components/plan/PlanPanel";
import { Button, DifficultyBadge, GoatMark } from "../components/ui";
import ReviewList from "../components/shared/ReviewList";
import { dueRecords } from "../lib/deck";
import SettingsPanel from "../components/shared/SettingsPanel";

type Tab = "review" | "plan" | "settings";

function usePrefersDark() {
  const [dark, setDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return dark;
}

/** Reuses the current LeetCode tab when there is one, instead of piling up tabs. */
async function openProblem(slug: string) {
  const url = problemUrl(slug);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id && tab.url?.startsWith("https://leetcode.com/")) await chrome.tabs.update(tab.id, { url });
  else await chrome.tabs.create({ url });
  window.close();
}

function DailyCard() {
  const [daily, setDaily] = useState<DailyChallenge | null>(null);
  const [failed, setFailed] = useState(false);
  const records = useAllProblems();

  useEffect(() => {
    fetchDailyChallenge()
      .then(setDaily)
      .catch(() => setFailed(true));
  }, []);

  if (failed) return null;
  const solved = daily && (daily.lcStatus === "ac" || records.some((r) => r.slug === daily.slug && r.solvedAt));

  return (
    <section className="rounded-xl border border-line bg-surface p-3.5">
      <div className="flex items-center gap-1.5 text-faint">
        <CalendarDays className="size-3.5" />
        <span className="text-2xs font-semibold tracking-wide uppercase">Daily challenge</span>
      </div>
      {daily ? (
        <div className="mt-2 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">
              {daily.id}. {daily.title}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <DifficultyBadge difficulty={daily.difficulty} />
              {solved && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-easy">
                  <CircleCheck className="size-3" /> Done
                </span>
              )}
            </div>
          </div>
          <Button size="sm" variant={solved ? "secondary" : "primary"} onClick={() => void openProblem(daily.slug)}>
            {solved ? "Open" : "Solve"}
          </Button>
        </div>
      ) : (
        <div className="mt-2 h-10 animate-pulse rounded-lg bg-raised" />
      )}
    </section>
  );
}

export default function Popup() {
  const [settings, updateSettings] = useSettings();
  const records = useAllProblems();
  const prefersDark = usePrefersDark();
  const dark = settings.theme === "auto" ? prefersDark : settings.theme === "dark";
  const dueCount = useMemo(() => dueRecords(records).length, [records]);
  const [tab, setTab] = useState<Tab>("review");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "review", label: dueCount ? `Review ${dueCount}` : "Review", icon: <CalendarClock /> },
    { id: "plan", label: "Plan", icon: <MapIcon /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon /> },
  ];

  return (
    <div className="flex max-h-[580px] w-[380px] flex-col bg-canvas text-fg">
      <header className="flex shrink-0 items-center gap-2.5 border-b border-line bg-surface px-4 py-3">
        <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-fg">
          <GoatMark className="size-4.5" />
        </span>
        <div className="leading-tight">
          <div className="text-base font-semibold">LeetGoat</div>
          <div className="text-2xs text-faint">Practice that sticks</div>
        </div>
      </header>

      <div className="lg-scroll min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {tab === "review" && (
          <>
            <DailyCard />
            <ReviewList records={records} onOpen={(slug) => void openProblem(slug)} />
          </>
        )}
        {tab === "plan" && (
          <PlanPanel
            settings={settings}
            onSettings={updateSettings}
            records={records}
            onOpen={(slug) => void openProblem(slug)}
            canRefresh={false}
          />
        )}
        {tab === "settings" && <SettingsPanel settings={settings} onChange={updateSettings} />}
      </div>

      <nav className="flex shrink-0 border-t border-line bg-surface">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex h-12 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-2xs font-medium transition-colors [&>svg]:size-4",
              tab === t.id ? "text-accent" : "text-muted hover:text-fg"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
