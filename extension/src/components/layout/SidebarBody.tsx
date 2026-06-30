import type { Problem } from "../../types/problem";
import Card from "../ui/Card";
import ProblemCard from "../problem/ProblemCard";

interface SidebarBodyProps {
  problem: Problem | null;
}

export default function SidebarBody({ problem }: SidebarBodyProps) {
  return (
    <div className="flex-1 overflow-y-auto space-y-5 px-5 pt-8 pb-5">
      <ProblemCard problem={problem} />

      <Card>
        <h3 className="font-semibold text-slate-900">Status</h3>
        <p className="mt-2 text-sm text-slate-500">Not solved yet</p>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900">Quick Actions</h3>
        <p className="mt-2 text-sm text-slate-500">Coming soon...</p>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900">Today&apos;s Goal</h3>
        <p className="mt-2 text-sm text-slate-500">0 / 3 Problems</p>
      </Card>
    </div>
  );
}