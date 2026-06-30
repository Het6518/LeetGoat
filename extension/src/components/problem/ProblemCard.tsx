import Card from "../ui/Card";
import type { Problem } from "../../types/problem";

interface ProblemCardProps {
  problem: Problem | null;
}

export default function ProblemCard({ problem }: ProblemCardProps) {
  if (!problem) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Loading problem...</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            Current Problem
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {problem.title}
          </h2>
        </div>

        <span className="inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
          {problem.difficulty}
        </span>

        <div className="flex flex-wrap gap-2">
          {problem.topics.map((topic) => (
            <span
              key={topic}
              className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}