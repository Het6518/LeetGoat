import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { themes, type Theme } from "./theme";

interface ThemeContextType {
  theme: Theme;
  currentTheme: typeof themes.light;
  toggleTheme: () => void;
}

export const ThemeContext =
  createContext<ThemeContextType | null>(null);

interface Props {
  children: ReactNode;
}

export function ThemeProvider({
  children,
}: Props) {
  const [theme, setTheme] =
    useState<Theme>("light");

  useEffect(() => {
    const stored =
      localStorage.getItem("leetgoat-theme");

    if (
      stored === "light" ||
      stored === "dark"
    ) {
      setTheme(stored);
    }
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next =
        prev === "light"
          ? "dark"
          : "light";

      localStorage.setItem(
        "leetgoat-theme",
        next
      );

      return next;
    });
  }

  const value = useMemo(
    () => ({
      theme,
      currentTheme: themes[theme],
      toggleTheme,
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}