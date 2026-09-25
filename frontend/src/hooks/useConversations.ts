import { CONVERSATIONS } from "@/mocks/conversations";
import type { Conversation } from "@/types";

/**
 * Conversation list, most recent activity first, pinned chats grouped on top.
 * Phase 1 serves fixtures; Phase 3 swaps the body for a TanStack Query call.
 */
export function useConversations(): { pinned: Conversation[]; others: Conversation[] } {
  const sorted = [...CONVERSATIONS].sort(
    (a, b) => Date.parse(b.lastMessage.createdAt) - Date.parse(a.lastMessage.createdAt),
  );
  return {
    pinned: sorted.filter((c) => c.isPinned),
    others: sorted.filter((c) => !c.isPinned),
  };
}

export function useConversation(id: string): Conversation | undefined {
  return CONVERSATIONS.find((c) => c.id === id);
}
