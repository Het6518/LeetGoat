import { Code2 } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-4">
      <div
        className="
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-2xl
        bg-white/15
        backdrop-blur-xl
        ring-1
        ring-white/20
        "
      >
        <Code2 className="text-white" size={24} />
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          LeetGoat
        </h1>

        <p className="text-sm text-blue-100">
          Your Coding Companion
        </p>
      </div>
    </div>
  );
}