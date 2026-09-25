"use client";

import { useQueryClient } from "@tanstack/react-query";

import { removeReaction, setReaction } from "@/lib/api/messages";
import { updateReactions } from "@/lib/query/cache";
import { useUiStore } from "@/stores/ui";
import type { Message } from "@/types";

/** Add / change / remove my reaction on a message (one per person: the server replaces it). */
export function useReactions() {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((state) => state.pushToast);

  const react = async (message: Message, emoji: string) => {
    const mine = message.reactions.find((r) => r.reactedByMe)?.emoji;
    try {
      const updated =
        mine === emoji ? await removeReaction(message.id) : await setReaction(message.id, emoji);
      updateReactions(queryClient, {
        messageId: message.id,
        conversationId: message.conversationId,
        reactions: updated.reactions,
      });
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not react");
    }
  };

  return { react };
}
