import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../theme/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-xl ring-1 ring-white/20 transition-all duration-300 hover:bg-white/25 hover:scale-105"
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}