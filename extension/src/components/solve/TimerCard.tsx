import { CircleCheck, Pause, Play, RotateCcw, Timer as TimerIcon } from "lucide-react";
import type { Timer } from "../../hooks/useTimer";
import { formatClock, MINUTE } from "../../lib/dates";
import { cn } from "../../lib/utils";
import { Button, Card, IconButton, ProgressBar } from "../ui";

export default function TimerCard({
  timer,
  targetMin,
  hasHints,
  solved,
  onMarkSolved,
}: {
  timer: Timer;
  targetMin: number;
  hasHints: boolean;
  solved: boolean;
  onMarkSolved: () => void;
}) {
  const progress = timer.elapsedMs / (targetMin * MINUTE);
  const over = progress >= 1;
  const wayOver = progress >= 1.5;

  return (
    <Card title="Focus timer" icon={<TimerIcon />}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "font-mono text-3xl font-semibold tracking-tight tabular-nums",
            over && "text-medium",
            wayOver && "text-hard"
          )}
        >
          {formatClock(timer.elapsedMs)}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <IconButton label="Reset attempt timer" onClick={timer.reset}>
            <RotateCcw />
          </IconButton>
          <Button variant={timer.running ? "secondary" : "primary"} onClick={timer.running ? timer.pause : timer.start}>
            {timer.running ? <Pause /> : <Play />}
            {timer.running ? "Pause" : timer.elapsedMs > 0 ? "Resume" : "Start"}
          </Button>
        </div>
      </div>

      <ProgressBar
        value={progress}
        className="mt-3"
        barClassName={cn(over && "bg-medium", wayOver && "bg-hard")}
      />
      <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
        <span>Target {targetMin} min</span>
        <span>{timer.running ? "Running · pauses when you leave the tab" : "Paused"}</span>
      </div>

      {wayOver && (
        <p className="mt-3 rounded-lg bg-raised px-3 py-2 text-xs text-muted">
          Well past your target.{" "}
          {hasHints ? "Try one hint below" : "Consider reading the editorial"} — being stuck for too long
          teaches less than learning the pattern and reviewing it later.
        </p>
      )}

      {!solved && (
        <button
          type="button"
          onClick={onMarkSolved}
          className="mt-3 inline-flex cursor-pointer items-center gap-1 text-xs text-faint transition-colors hover:text-accent"
        >
          <CircleCheck className="size-3" />
          Got accepted but LeetGoat missed it? Mark solved
        </button>
      )}
    </Card>
  );
}
