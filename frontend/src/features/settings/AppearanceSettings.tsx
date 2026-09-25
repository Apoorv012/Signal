"use client";

import clsx from "clsx";

import { type ThemeChoice, useTheme } from "@/hooks/useTheme";

const OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/** Functional appearance settings: theme (system / light / dark). */
export function AppearanceSettings() {
  const { choice, setChoice } = useTheme();

  return (
    <div>
      <h3 className="text-secondary pb-2 text-[0.875rem] font-medium">Theme</h3>
      <div role="radiogroup" aria-label="Theme" className="divide-divider divide-y">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={choice === option.value}
            onClick={() => setChoice(option.value)}
            className="flex w-full items-center justify-between py-3.5 text-left"
          >
            <span className="text-text text-[1rem]">{option.label}</span>
            <span
              className={clsx(
                "flex size-6 items-center justify-center rounded-full border-2",
                choice === option.value ? "border-unread" : "border-secondary/50",
              )}
            >
              {choice === option.value && <span className="bg-unread size-3 rounded-full" />}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
