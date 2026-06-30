export type Theme = "light" | "dark";

export const themes = {
  light: {
    background: "bg-slate-50",
    card: "bg-white",
    border: "border-slate-200",
    text: "text-slate-900",
    muted: "text-slate-500",

    hero:
      "from-sky-500 via-blue-600 to-indigo-700",
  },

  dark: {
    background: "bg-[#09090B]",
    card: "bg-zinc-900",

    border: "border-zinc-800",

    text: "text-white",

    muted: "text-zinc-400",

    hero:
      "from-[#111827] via-[#1E3A8A] to-[#312E81]",
  },
};