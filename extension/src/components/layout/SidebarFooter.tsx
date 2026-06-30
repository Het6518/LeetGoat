import { ArrowRight, BarChart3 } from "lucide-react";

export default function SidebarFooter() {
  return (
    <div className="border-t border-slate-200 bg-white p-5">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-4 text-left text-white transition hover:scale-[1.02]"
      >
        <div className="flex items-center gap-3">
          <BarChart3 />
          <div>
            <p className="font-semibold">Analyze My Profile</p>
            <p className="text-sm text-blue-100">Track your learning journey</p>
          </div>
        </div>

        <ArrowRight />
      </button>
    </div>
  );
}