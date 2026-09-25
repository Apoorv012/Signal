"use client";

import { useCallback, useEffect, useRef } from "react";

import { useCurrentUser } from "@/hooks/useSession";
import { realtime } from "@/lib/realtime/client";
import { usePresenceStore } from "@/stores/presence";
import type { Conversation, User } from "@/types";

const STOP_AFTER_MS = 3000;

/** Broadcasts "typing…" while the user types, and "stopped" after a pause / on send / on leave. */
export function useTypingBroadcast(conversationId: number) {
  const typing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const stop = useCallback(() => {
    clearTimeout(timer.current);
    if (typing.current) realtime.sendTyping(conversationId, false);
    typing.current = false;
  }, [conversationId]);

  const onInput = useCallback(() => {
    if (!typing.current) {
      typing.current = true;
      realtime.sendTyping(conversationId, true);
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(stop, STOP_AFTER_MS);
  }, [conversationId, stop]);

  useEffect(() => stop, [stop]); // leaving the chat also ends typing

  return { onInput, stop };
}

/** Members (other than me) currently typing in this conversation. */
export function useTypingUsers(conversation: Conversation): User[] {
  const me = useCurrentUser();
  const typingIds = usePresenceStore((state) => state.typing[conversation.id]);
  return (typingIds ?? [])
    .filter((id) => id !== me.id)
    .map((id) => conversation.members.find((m) => m.user.id === id)?.user)
    .filter((user): user is User => user !== undefined);
}

/** Online state: live WebSocket updates win over the snapshot the API returned. */
export function useIsOnline(user: User | undefined): boolean {
  const live = usePresenceStore((state) => (user ? state.presence[user.id] : undefined));
  return live?.isOnline ?? user?.isOnline ?? false;
}

export function useLastSeen(user: User | undefined): string | null {
  const live = usePresenceStore((state) => (user ? state.presence[user.id] : undefined));
  return live?.lastSeenAt ?? user?.lastSeenAt ?? null;
}
