import React, { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "powercare_theme";

// Dark-mode switch — applies the .dark class while the app layout is mounted,
// and removes it on unmount so the public landing pages always stay light.
export default function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem(KEY) === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(KEY, dark ? "dark" : "light");
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="p-2 rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="w-4 h-4" strokeWidth={1.75} /> : <Moon className="w-4 h-4" strokeWidth={1.75} />}
    </button>
  );
}