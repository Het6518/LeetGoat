import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../lib/utils";
import { recordPaste, recordVerdict } from "../lib/actions";
import { storageAvailable, touchProblem } from "../lib/storage";
import { playVerdictSound } from "../lib/sounds";
import { onBridgePaste, onBridgeVerdict } from "../lib/bridge";
import { profileSlugFromPath } from "../lib/contest";
import { planProgress, titleFor } from "../lib/plans";
import { getPlan } from "../data/plans";
import { problemUrl } from "../api/leetcode";
import { dueRecords } from "../lib/deck";
import {
  useAllProblems,
  useProblemRecord,
  useSettings,
} from "../hooks/useStorage";
import { useBlindMode, useLeetCodeDark, useProblem, useProblemSlug, useSubmissionWatcher, type Verdict } from "../hooks/usePage";
import { useProblemTimer } from "../hooks/useTimer";
import { usePlanMeta } from "../hooks/usePlanMeta";
import SnippetPalette from "../components/snippets/SnippetPalette";
import Dock, { type Toast } from "./Dock";
import Sidebar, { type Tab } from "./Sidebar";
import VerdictBanner, { type Banner } from "./VerdictBanner";

function useProfileSlug(): string | null {
  const [slug, setSlug] = useState(() => profileSlugFromPath());
  useEffect(() => {
    const id = window.setInterval(() => setSlug(profileSlugFromPath()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return slug;
}

export default function App() {
  const slug = useProblemSlug();
  const profileSlug = useProfileSlug();
  const [checkToken, setCheckToken] = useState(0);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>(slug ? "solve" : "plan");
  const [snippetsOpen, setSnippetsOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const [settings, updateSettings] = useSettings();
  const leetcodeDark = useLeetCodeDark();
  const dark = settings.theme === "auto" ? leetcodeDark : settings.theme === "dark";

  const { problem, error } = useProblem(slug);
  const record = useProblemRecord(slug);
  const records = useAllProblems();
  const timer = useProblemTimer(slug, record, settings.autoTimer);
  const dueCount = useMemo(() => dueRecords(records).length, [records]);

  const { meta } = usePlanMeta(true);
  const recordMap = useMemo(() => new Map(records.map((r) => [r.slug, r])), [records]);
  const next = planProgress(getPlan(settings.plan), meta, recordMap).next;
  const nextSlug = next && next !== slug ? next : null;

  const showToast = useCallback((text: string, tone: Toast["tone"]) => {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, tone });
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  useBlindMode(settings.blindMode && !!slug);

  // Keep stored metadata (title, difficulty, topics) fresh.
  useEffect(() => {
    if (problem && storageAvailable()) void touchProblem(problem);
  }, [problem]);

  const [banner, setBanner] = useState<Banner | null>(null);
  const handledVerdicts = useRef(new Set<string>());

  // Verdicts arrive from two sources (LeetCode's check request via the bridge,
  // and the result panel) — whichever is first wins, the other is ignored.
  const handleVerdict = (verdict: Verdict) => {
    if (!slug) return;
    const key = verdict.submissionId ?? `${verdict.text}@${Math.floor(Date.now() / 5000)}`;
    if (handledVerdicts.current.has(key)) return;
    handledVerdicts.current.add(key);

    setBanner({ id: Date.now(), accepted: verdict.accepted, detail: verdict.text });
    void playVerdictSound(verdict.accepted, settings.sounds);
    if (verdict.accepted) timer.pause();
    if (!storageAvailable()) return;

    void recordVerdict(slug, verdict).then((updated) => {
      if (updated?.pendingRating && verdict.accepted) {
        setTab("solve");
        setOpen(true);
      }
    });
  };
  const verdictHandler = useRef(handleVerdict);
  useEffect(() => {
    verdictHandler.current = handleVerdict;
  });

  useSubmissionWatcher(slug, (verdict) => verdictHandler.current(verdict));

  useEffect(
    () =>
      onBridgeVerdict((v) =>
        verdictHandler.current({ text: v.statusMsg || (v.accepted ? "Accepted" : "Rejected"), accepted: v.accepted, submissionId: v.submissionId })
      ),
    []
  );

  // Outside pastes into the editor (reported by the page bridge).
  const trackPastes = settings.trackPastes;
  useEffect(() => {
    if (!slug || !trackPastes) return;
    return onBridgePaste((paste) => {
      if (!paste.external || !storageAvailable()) return;
      void recordPaste(slug, paste.chars);
      showToast(`Pasted ${paste.chars} chars from outside — noted for this attempt`, "info");
    });
  }, [slug, trackPastes, showToast]);

  // Keyboard commands arrive as messages from the background worker.
  useEffect(() => {
    if (!storageAvailable()) return;
    const listener = (message: unknown) => {
      const type = (message as { type?: string })?.type;
      if (type === "toggle-sidebar") setOpen((o) => !o);
      if (type === "open-snippets" && slug) setSnippetsOpen(true);
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [slug]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !snippetsOpen) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, snippetsOpen]);

  // Page changed: pick a tab that makes sense here (adjusting state during render).
  const [tabFor, setTabFor] = useState(slug);
  if (slug !== tabFor) {
    setTabFor(slug);
    if (slug && (tab === "review" || tab === "plan" || tab === "check")) setTab("solve");
    if (!slug && tab === "solve") setTab(profileSlug ? "check" : "plan");
  }

  return (
    <div className={cn("lg-theme", dark && "dark")}>
      <Dock
        sidebarOpen={open}
        onToggleSidebar={() => setOpen((o) => !o)}
        dueCount={dueCount}
        timer={timer}
        onProblem={!!slug}
        onProfile={!!profileSlug}
        soundOn={settings.sounds.enabled}
        onToggleSound={() => updateSettings({ sounds: { ...settings.sounds, enabled: !settings.sounds.enabled } })}
        onSnippets={() => setSnippetsOpen(true)}
        nextTitle={nextSlug ? titleFor(nextSlug, meta) : null}
        onNext={() => {
          if (nextSlug) window.location.href = problemUrl(nextSlug);
        }}
        onCheckAccount={() => {
          setTab("check");
          setOpen(true);
          setCheckToken((t) => t + 1);
        }}
        toast={toast}
      />
      <Sidebar
        open={open}
        onClose={() => setOpen(false)}
        tab={tab}
        onTab={setTab}
        dark={dark}
        slug={slug}
        profileSlug={profileSlug}
        checkToken={checkToken}
        problem={problem}
        problemError={error}
        record={record}
        records={records}
        settings={settings}
        onSettings={updateSettings}
        timer={timer}
      />
      <SnippetPalette open={snippetsOpen} onClose={() => setSnippetsOpen(false)} />
      {banner && <VerdictBanner key={banner.id} banner={banner} onDone={() => setBanner(null)} />}
    </div>
  );
}
