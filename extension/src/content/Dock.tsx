import { useEffect, useRef, useState, type ReactNode } from "react";
import { Braces, ChevronLeft, ChevronRight, GripVertical, Pause, Play, ShieldAlert, SkipForward, Volume2, VolumeX } from "lucide-react";
import { formatClock } from "../lib/dates";
import { cn } from "../lib/utils";
import { GoatMark } from "../components/ui";
import type { Timer } from "../hooks/useTimer";

const POSITION_KEY = "leetgoat:dock";
const SIDEBAR_WIDTH = 400;

interface Position {
  right: number;
  bottom: number;
}

function loadPosition(): Position {
  try {
    const saved = JSON.parse(localStorage.getItem(POSITION_KEY) ?? "null") as Position | null;
    if (saved && Number.isFinite(saved.right) && Number.isFinite(saved.bottom)) return saved;
  } catch {
    /* blocked or corrupt — use default */
  }
  return { right: 16, bottom: 88 };
}

function clamp(p: Position): Position {
  return {
    right: Math.min(Math.max(8, p.right), window.innerWidth - 80),
    bottom: Math.min(Math.max(8, p.bottom), window.innerHeight - 52),
  };
}

function DockButton({ label, onClick, children, active }: { label: string; onClick: () => void; children: ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "grid size-8 cursor-pointer place-items-center rounded-full transition-colors hover:bg-raised hover:text-fg [&>svg]:size-4",
        active ? "text-accent" : "text-muted"
      )}
    >
      {children}
    </button>
  );
}

export interface Toast {
  id: number;
  text: string;
  tone: "good" | "bad" | "info";
}

/**
 * The always-on floating hub: sidebar toggle, live timer and one-tap tools.
 * Drag the grip to put it anywhere; it slides left while the sidebar is open.
 */
export default function Dock({
  sidebarOpen,
  onToggleSidebar,
  dueCount,
  timer,
  onProblem,
  onProfile,
  soundOn,
  onToggleSound,
  onSnippets,
  nextTitle,
  onNext,
  onCheckAccount,
  toast,
}: {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  dueCount: number;
  timer: Timer;
  onProblem: boolean;
  onProfile: boolean;
  soundOn: boolean;
  onToggleSound: () => void;
  onSnippets: () => void;
  nextTitle: string | null;
  onNext: () => void;
  onCheckAccount: () => void;
  toast: Toast | null;
}) {
  const [pos, setPos] = useState(loadPosition);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(`${POSITION_KEY}:collapsed`) === "1";
    } catch {
      return false;
    }
  });
  const drag = useRef<{ x: number; y: number; start: Position } | null>(null);

  useEffect(() => {
    const onResize = () => setPos((p) => clamp(p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const save = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage blocked — position just won't persist */
    }
  };

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      save(`${POSITION_KEY}:collapsed`, c ? "0" : "1");
      return !c;
    });
  };

  // Don't sit on top of the open sidebar.
  const right = sidebarOpen && pos.right < SIDEBAR_WIDTH + 8 ? pos.right + SIDEBAR_WIDTH : pos.right;

  return (
    <div
      className="fixed z-[2147483000] flex flex-col items-end gap-2 transition-[right] duration-250 ease-out"
      style={{ right, bottom: pos.bottom }}
    >
      {toast && (
        <div
          key={toast.id}
          className={cn(
            "lg-pop max-w-72 rounded-xl border px-3 py-2 text-xs font-medium shadow-lg",
            toast.tone === "good" && "border-easy/40 bg-surface text-easy",
            toast.tone === "bad" && "border-hard/40 bg-surface text-hard",
            toast.tone === "info" && "border-line bg-surface text-fg"
          )}
        >
          {toast.text}
        </div>
      )}

      <div className="flex h-11 items-center gap-0.5 rounded-full border border-line bg-surface/95 p-1 text-fg shadow-lg shadow-black/20 backdrop-blur select-none">
        <span
          title="Drag to move"
          className="grid h-8 w-4 cursor-grab touch-none place-items-center text-faint active:cursor-grabbing"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, start: pos };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            setPos(clamp({ right: d.start.right - (e.clientX - d.x), bottom: d.start.bottom - (e.clientY - d.y) }));
          }}
          onPointerUp={() => {
            drag.current = null;
            setPos((p) => {
              save(POSITION_KEY, JSON.stringify(p));
              return p;
            });
          }}
        >
          <GripVertical className="size-3.5" />
        </span>

        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle LeetGoat (Alt+G)"
          title="LeetGoat · Alt+G"
          className="relative grid size-8 cursor-pointer place-items-center rounded-full bg-accent text-accent-fg transition-transform hover:scale-105"
        >
          <GoatMark className="size-4.5" />
          {dueCount > 0 && (
            <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-hard px-1 text-2xs leading-none font-bold text-white ring-2 ring-surface">
              {dueCount}
            </span>
          )}
        </button>

        {onProblem && (
          <button
            type="button"
            onClick={timer.running ? timer.pause : timer.start}
            title={timer.running ? "Pause timer" : "Start timer"}
            className="group flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 font-mono text-sm font-medium tabular-nums hover:bg-raised"
          >
            {timer.running ? (
              <>
                <span className="size-1.5 animate-pulse rounded-full bg-easy group-hover:hidden" />
                <Pause className="hidden size-3 group-hover:block" />
              </>
            ) : (
              <Play className="size-3 text-faint" />
            )}
            {formatClock(timer.elapsedMs)}
          </button>
        )}

        {!collapsed && (
          <>
            <span className="mx-0.5 h-5 w-px bg-line" />
            {onProblem && (
              <DockButton label="Snippets (Alt+S)" onClick={onSnippets}>
                <Braces />
              </DockButton>
            )}
            {nextTitle && (
              <DockButton label={`Next in plan: ${nextTitle}`} onClick={onNext}>
                <SkipForward />
              </DockButton>
            )}
            {onProfile && (
              <DockButton label="Cheat-check this account's contests" onClick={onCheckAccount}>
                <ShieldAlert />
              </DockButton>
            )}
            <DockButton label={soundOn ? "Mute verdict sounds" : "Unmute verdict sounds"} onClick={onToggleSound} active={soundOn}>
              {soundOn ? <Volume2 /> : <VolumeX />}
            </DockButton>
          </>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand dock" : "Collapse dock"}
          className="grid h-8 w-5 cursor-pointer place-items-center rounded-full text-faint hover:text-fg"
        >
          {collapsed ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}
