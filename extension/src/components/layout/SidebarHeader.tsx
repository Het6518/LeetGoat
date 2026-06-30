import { Moon, Settings, X } from "lucide-react";

import Logo from "../ui/Logo";
import IconButton from "../ui/IconButton";

export default function SidebarHeader() {
  return (
    <header
      className="
      relative

      overflow-hidden

      rounded-b-[40px]

      bg-gradient-to-br

      from-sky-600

      via-indigo-700

      to-violet-700

      px-6

      pt-6

      pb-16

      text-white
      "
    >
      {/* Glow */}

      <div
        className="
        absolute

        -right-16

        -top-16

        h-60

        w-60

        rounded-full

        bg-cyan-300/20

        blur-3xl
        "
      />

      <div
        className="
        absolute

        left-0

        bottom-0

        h-40

        w-40

        rounded-full

        bg-violet-400/20

        blur-3xl
        "
      />

      {/* Content */}

      <div className="relative flex items-start justify-between">
        <Logo />

        <div className="flex gap-2">
          <IconButton>
            <Moon size={18} />
          </IconButton>

          <IconButton>
            <Settings size={18} />
          </IconButton>

          <IconButton>
            <X size={18} />
          </IconButton>
        </div>
      </div>

      {/* Curve */}

      <div
        className="
        absolute

        bottom-0

        left-0

        h-16

        w-full

        translate-y-1/2

        rounded-[100%]

        bg-slate-50
        "
      />
    </header>
  );
}