import { Code2 } from "lucide-react";

interface FloatingButtonProps {
  onClick: () => void;
}

export default function FloatingButton({ onClick }: FloatingButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[999998] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-700 text-white shadow-xl transition hover:scale-105"
      aria-label="Open LeetGoat"
    >
      <Code2 size={24} />
    </button>
  );
}