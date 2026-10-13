import { useMemo } from "react";
import { CalendarClock, ChevronRight, Layers, Sparkles } from "lucide-react";
import type { ProblemRecord } from "../../types";
import { addDays, formatDue } from "../../lib/dates";
import { dueRecords } from "../../lib/deck";
import { useNow } from "../../hooks/useNow";
import { cn } from "../../lib/utils";
import { Card, DifficultyDot, Empty } from "../ui";

function Row({
  record,
  meta,
  metaClass,
  onOpen,
  active,
}: {
  record: ProblemRecord;
  meta: string;
  metaClass?: string;
  onOpen: (slug: string) => void;
  active: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(record.slug)}
        className={cn(
          "group flex w-full cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-raised",
          active && "bg-raised"
        )}
      >
        <DifficultyDot difficulty={record.difficulty} className="mt-1.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate text-sm font-medium">{record.title}</span>
            <span className={cn("ml-auto shrink-0 text-2xs text-faint", metaClass)}>{meta}</span>
          </div>
          {record.notes.insight && (
            <div className="mt-0.5 truncate text-xs text-muted">💡 {record.notes.insight}</div>
          )}
        </div>
        <ChevronRight className="mt-1 size-3.5 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    </li>
  );
}

export default function ReviewList({
  records,
  onOpen,
  currentSlug,
}: {
  records: ProblemRecord[];
  onOpen: (slug: string) => void;
  currentSlug?: string | null;
}) {
  const now = useNow();
  const { pending, due, upcoming, deckSize } = useMemo(() => {
    const horizon = addDays(now, 8);
    return {
      pending: records.filter((r) => r.pendingRating),
      due: dueRecords(records, now),
      upcoming: records
        .filter((r) => r.review && r.review.due > now && r.review.due < horizon)
        .sort((a, b) => a.review!.due - b.review!.due),
      deckSize: records.filter((r) => r.review).length,
    };
  }, [records, now]);

  if (!deckSize && !pending.length) {
    return (
      <Empty icon={<Layers />} title="Your review deck is empty">
        Solve a problem and rate how it went. LeetGoat schedules it to come back right before you'd forget it.
      </Empty>
    );
  }

  return (
    <div className="space-y-3">
      {pending.length > 0 && (
        <Card title="Waiting for a rating" icon={<Sparkles />}>
          <ul className="-mx-2">
            {pending.map((r) => (
              <Row key={r.slug} record={r} meta="rate it" metaClass="text-accent" onOpen={onOpen} active={r.slug === currentSlug} />
            ))}
          </ul>
        </Card>
      )}

      <Card
        title="Due now"
        icon={<CalendarClock />}
        action={<span className="text-xs text-faint">{due.length} of {deckSize} in deck</span>}
      >
        {due.length ? (
          <ul className="-mx-2">
            {due.map((r) => {
              const label = formatDue(r.review!.due, now);
              return (
                <Row
                  key={r.slug}
                  record={r}
                  meta={label}
                  metaClass={label.startsWith("overdue") ? "text-hard" : undefined}
                  onOpen={onOpen}
                  active={r.slug === currentSlug}
                />
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">All caught up. 🎉 Nothing to review right now.</p>
        )}
      </Card>

      {upcoming.length > 0 && (
        <Card title="Coming up this week" icon={<Layers />}>
          <ul className="-mx-2">
            {upcoming.slice(0, 10).map((r) => (
              <Row key={r.slug} record={r} meta={formatDue(r.review!.due, now)} onOpen={onOpen} active={r.slug === currentSlug} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
