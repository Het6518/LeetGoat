import { PartyPopper, X } from "lucide-react";
import type { ProblemRecord, Rating } from "../../types";
import { RATINGS, nextInterval, suggestRating } from "../../lib/srs";
import { formatClock, formatInterval } from "../../lib/dates";
import { cn } from "../../lib/utils";
import { IconButton } from "../ui";

const TONE: Record<Rating, string> = {
  again: "hover:border-hard hover:text-hard",
  hard: "hover:border-medium hover:text-medium",
  good: "hover:border-easy hover:text-easy",
  easy: "hover:border-accent hover:text-accent",
};

export default function RatePrompt({
  record,
  sessionMs,
  targetMs,
  onRate,
  onDismiss,
}: {
  record: ProblemRecord;
  sessionMs: number;
  targetMs: number;
  onRate: (rating: Rating) => void;
  onDismiss: () => void;
}) {
  const { hints, fails } = record.session;
  const pasted = record.session.pasted ?? 0;
  const suggested = suggestRating({ timeMs: sessionMs, targetMs, hints, fails, pasted });
  const isReview = record.review !== null;

  const facts = [
    sessionMs > 0 && `${formatClock(sessionMs)} on the clock`,
    fails > 0 && `${fails} wrong submission${fails === 1 ? "" : "s"}`,
    hints > 0 && `${hints} hint${hints === 1 ? "" : "s"} used`,
    pasted > 0 && `${pasted} chars pasted from outside`,
  ].filter(Boolean);

  return (
    <section className="lg-pop rounded-xl border border-accent/40 bg-accent-soft p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-fg">
          <PartyPopper className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{isReview ? "Review complete" : "Accepted — nice."}</div>
          <div className="text-xs text-muted">
            {facts.length ? facts.join(" · ") : "How did it go?"}
          </div>
        </div>
        <IconButton label="Skip rating" onClick={onDismiss} className="-mt-1 -mr-1 size-7">
          <X />
        </IconButton>
      </div>

      <p className="mt-3 text-xs text-muted">
        How well did you know it? This schedules when LeetGoat brings it back for review.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {RATINGS.map((r) => (
          <button
            key={r.id}
            type="button"
            title={r.hint}
            onClick={() => onRate(r.id)}
            className={cn(
              "flex cursor-pointer flex-col items-start rounded-lg border bg-surface px-3 py-2 text-left transition-colors",
              TONE[r.id],
              suggested === r.id ? "border-accent ring-2 ring-accent/25" : "border-line"
            )}
          >
            <span className="flex w-full items-center justify-between text-sm font-semibold">
              {r.label}
              <span className="font-mono text-2xs font-normal text-faint">
                {formatInterval(nextInterval(record.review, r.id))}
              </span>
            </span>
            <span className="text-2xs text-muted">{suggested === r.id ? "Suggested" : r.hint}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
