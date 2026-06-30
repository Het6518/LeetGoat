import SidebarHeader from "./SidebarHeader";
import SidebarBody from "./SidebarBody";
import SidebarFooter from "./SidebarFooter";
import type { Problem } from "../../types/problem";

interface SidebarProps {
  open: boolean;
  problem: Problem | null;
}

export default function Sidebar({ open, problem }: SidebarProps) {
  return (
    <aside
      className={`
        fixed right-0 top-0 z-[999999]
        flex h-screen w-[400px] flex-col
        bg-slate-50
        shadow-2xl
        transition-transform duration-300
        ${open ? "translate-x-0" : "translate-x-full"}
      `}
    >
      <SidebarHeader />
      <SidebarBody problem={problem} />
      <SidebarFooter />
    </aside>
  );
}