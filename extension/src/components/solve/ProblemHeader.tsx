import { useState } from "react";
import { CircleCheck, Eye, ThumbsUp, Users } from "lucide-react";
import type { Problem, ProblemRecord } from "../../types";
import { topicUrl } from "../../api/leetcode";
import { Chip, DifficultyBadge } from "../ui";
import { isDue } from "../../hooks/useTimer";

function StatusChip({ problem, record }: { problem: Problem; record: ProblemRecord | null | undefined }) {
  if (isDue(record)) return <Chip className="bg-accent-soft text-accent">Review due</Chip>;
  if (record?.review) return <Chip className="bg-easy/12 text-easy">In your deck</Chip>;
  if (record?.solvedAt || problem.lcStatus === "ac")
    return (
      <Chip className="gap-1 bg-easy/12 text-easy">
        <CircleCheck className="size-3" /> Solved
      </Chip>
    );
  if (problem.lcStatus === "notac" || (record?.attempts ?? 0) > 0) return <Chip>Attempted</Chip>;
  return null;
}

export default function ProblemHeader({
  problem,
  record,
  hideTopics,
}: {
  problem: Problem;
  record: ProblemRecord | null | undefined;
  hideTopics: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const showTopics = !hideTopics || revealed;
  const likeRatio =
    problem.likes + problem.dislikes > 0
      ? Math.round((problem.likes / (problem.likes + problem.dislikes)) * 100)
      : null;

  return (
    <div className="px-1">
      <div className="text-xs font-medium text-faint">Problem {problem.id}</div>
      <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-balance">{problem.title}</h2>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <DifficultyBadge difficulty={problem.difficulty} />
        <StatusChip problem={problem} record={record} />
        {problem.acRate && (
          <Chip className="gap-1" >
            <Users className="size-3" /> {problem.acRate} accepted
          </Chip>
        )}
        {likeRatio !== null && (
          <Chip className="gap-1">
            <ThumbsUp className="size-3" /> {likeRatio}%
          </Chip>
        )}
      </div>

      {problem.topics.length > 0 && (
        <div className="mt-3">
          {showTopics ? (
            <div className="flex flex-wrap gap-1.5">
              {problem.topics.map((t) => (
                <a
                  key={t.slug}
                  href={topicUrl(t.slug)}
                  className="inline-flex h-6 items-center rounded-md border border-line px-2 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  {t.name}
                </a>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-line px-2 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <Eye className="size-3" />
              Reveal {problem.topics.length} topic{problem.topics.length === 1 ? "" : "s"} (spoiler)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
