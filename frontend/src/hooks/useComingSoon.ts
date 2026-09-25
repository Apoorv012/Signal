"use client";

import { useCallback } from "react";

import { useUiStore } from "@/stores/ui";

/**
 * Controls for features that are placeholders (per the assignment) should still respond, so the
 * app never feels broken. Usage: `onClick={soon("Stickers")}` -> toast "Stickers: coming soon".
 */
export function useComingSoon() {
  const pushToast = useUiStore((state) => state.pushToast);
  return useCallback((feature: string) => () => pushToast(`${feature}: coming soon`), [pushToast]);
}
