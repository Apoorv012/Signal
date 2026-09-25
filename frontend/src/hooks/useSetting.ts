"use client";

import { useCallback, useEffect, useState } from "react";

import { useCurrentUser } from "@/hooks/useSession";

/** Stable storage key for a settings row, e.g. ("chats", "Send with Enter") -> "chats.send-with-enter". */
export const settingKey = (sectionId: string, label: string): string =>
  `${sectionId}.${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

const storageKey = (userId: number) => `signal-settings:${userId}`;

function readAll(userId: number): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

/**
 * A boolean preference saved in localStorage per account (so two accounts on one browser keep
 * separate settings). Read after mount to avoid a server/client hydration mismatch.
 */
export function useSetting(
  key: string,
  defaultValue: boolean,
): [boolean, (value: boolean) => void] {
  const userId = useCurrentUser().id;
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const stored = readAll(userId)[key];
    if (typeof stored === "boolean") setValue(stored);
  }, [userId, key]);

  const update = useCallback(
    (next: boolean) => {
      setValue(next);
      try {
        localStorage.setItem(
          storageKey(userId),
          JSON.stringify({ ...readAll(userId), [key]: next }),
        );
      } catch {
        /* storage blocked: the setting still applies until reload */
      }
    },
    [userId, key],
  );

  return [value, update];
}
