import { useCallback, useEffect, useState } from "react";

type Theme = "dark" | "light";
const KEY = "actionplan-theme";

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}

function initial(): Theme {
  try {
    const saved = localStorage.getItem(KEY) as Theme | null;
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    /* yok say */
  }
  return "dark"; // varsayılan: karanlık
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initial);

  useEffect(() => {
    apply(theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* yok say */
    }
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);
  return { theme, toggle };
}
