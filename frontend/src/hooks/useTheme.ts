"use client";

import { useCallback, useEffect, useState } from "react";

import { THEME_STORAGE_KEY } from "@/components/ThemeScript";

export type ThemeChoice = "system" | "light" | "dark";

function applyTheme(choice: ThemeChoice) {
  const dark =
    choice === "dark" ||
    (choice === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

/** Stored theme choice (system/light/dark), applied to <html data-theme>. */
export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>("system");

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeChoice | null;
    if (stored) setChoice(stored);
  }, []);

  // Follow OS changes while on "system".
  useEffect(() => {
    if (choice !== "system") return;
    const query = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [choice]);

  const update = useCallback((next: ThemeChoice) => {
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
    setChoice(next);
  }, []);

  return { choice, setChoice: update };
}
