"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { removeMessages } from "@/lib/query/cache";
import { queryKeys } from "@/lib/query/keys";
import type { Message } from "@/types";

const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/**
 * Disappearing messages: while a chat is open, remove each message from the screen the moment it
 * expires (the server also hides it on fetch and deletes it in its sweep).
 */
export function useMessageExpiry(conversationId: number, messages: Message[]): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const times = messages.flatMap((m) => (m.expiresAt ? [Date.parse(m.expiresAt)] : []));
    if (times.length === 0) return;
    const delay = Math.min(Math.max(Math.min(...times) - Date.now(), 0) + 300, MAX_TIMEOUT_MS);

    const timer = setTimeout(() => {
      const now = Date.now();
      const expired = messages
        .filter((m) => m.expiresAt && Date.parse(m.expiresAt) <= now)
        .map((m) => m.id);
      if (expired.length === 0) return;
      removeMessages(queryClient, conversationId, expired);
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations }); // list preview
    }, delay);
    return () => clearTimeout(timer);
  }, [messages, conversationId, queryClient]);
}
