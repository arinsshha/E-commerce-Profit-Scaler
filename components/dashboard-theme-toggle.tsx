"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "profitlens_real_world_mvp_v2";
const THEME_EVENT = "profitlens-dashboard-theme";

function readStoredTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return "light";
    const parsed = JSON.parse(saved);
    return parsed.dashboardTheme === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function writeStoredTheme(theme: "light" | "dark") {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, dashboardTheme: theme }));
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dashboardTheme: theme }));
  }
}

function playThemeAnimation() {
  document.body.classList.remove("dashboard-theme-animating");
  window.requestAnimationFrame(() => {
    document.body.classList.add("dashboard-theme-animating");
    window.setTimeout(() => {
      document.body.classList.remove("dashboard-theme-animating");
    }, 720);
  });
}

export function DashboardThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(readStoredTheme());

    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent).detail?.theme;
      if (nextTheme === "light" || nextTheme === "dark") {
        setTheme(nextTheme);
      }
    };

    window.addEventListener(THEME_EVENT, handleThemeChange);
    return () => window.removeEventListener(THEME_EVENT, handleThemeChange);
  }, []);

  const changeTheme = (nextTheme: "light" | "dark") => {
    if (nextTheme === theme) return;

    playThemeAnimation();
    setTheme(nextTheme);
    writeStoredTheme(nextTheme);
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme: nextTheme } }));
  };

  return (
    <div className="dashboard-theme-toggle inline-flex items-center rounded-2xl bg-slate-100 p-1 text-sm font-semibold text-slate-600">
      <button
        type="button"
        onClick={() => changeTheme("light")}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 transition ${
          theme === "light" ? "bg-white text-slate-900 shadow-sm" : "hover:bg-white/60"
        }`}
        aria-pressed={theme === "light"}
      >
        <Sun className="h-4 w-4" />
        Light
      </button>
      <button
        type="button"
        onClick={() => changeTheme("dark")}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 transition ${
          theme === "dark" ? "bg-slate-900 text-white shadow-sm" : "hover:bg-white/60"
        }`}
        aria-pressed={theme === "dark"}
      >
        <Moon className="h-4 w-4" />
        Dark
      </button>
    </div>
  );
}
