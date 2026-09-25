"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { useCurrentUser } from "@/hooks/useSession";
import { markRead } from "@/lib/api/messages";
import { clearUnread } from "@/lib/query/cache";
import type { Message } from "@/types";

function useWindowFocused(): boolean {
  const [focused, setFocused] = useState(
    () => typeof document === "undefined" || document.hasFocus(),
  );
  useEffect(() => {
    const update = () => setFocused(document.visibilityState === "visible" && document.hasFocus());
    window.addEventListener("focus", update);
    window.addEventListener("blur", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.removeEventListener("focus", update);
      window.removeEventListener("blur", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return focused;
}

/**
 * Tells the server which messages I have seen. Runs when the chat is open and the window is
 * focused, and again whenever a new incoming message arrives (this is what turns the sender's
 * ticks blue).
 */
export function useMarkRead(conversationId: number, messages: Message[]): void {
  const queryClient = useQueryClient();
  const me = useCurrentUser();
  const focused = useWindowFocused();
  const lastMarked = useRef(0);

  useEffect(() => {
    lastMarked.current = 0;
  }, [conversationId]);

  const newestIncoming = messages.reduce(
    (max, m) => (m.id > max && m.senderId !== me.id && m.senderId !== null ? m.id : max),
    0,
  );

  useEffect(() => {
    if (!focused || newestIncoming <= lastMarked.current) return;
    lastMarked.current = newestIncoming;
    clearUnread(queryClient, conversationId);
    markRead(conversationId, newestIncoming).catch(() => {
      lastMarked.current = 0; // allow another attempt on the next change
    });
  }, [focused, newestIncoming, conversationId, queryClient]);
}
