"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";

import { useCurrentUser } from "@/hooks/useSession";
import { clearConversation, removeMember, updateMySettings } from "@/lib/api/conversations";
import { clearMessages, removeConversation, upsertConversation } from "@/lib/query/cache";
import { useUiStore } from "@/stores/ui";
import type { Conversation } from "@/types";

/** Per-user chat actions used by the chat list right-click menu (HTTP + cache in one place). */
export function useConversationActions(conversation: Conversation) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const me = useCurrentUser();
  const pushToast = useUiStore((state) => state.pushToast);
  const openId = Number(useParams<{ conversationId?: string }>().conversationId);

  const attempt = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const patch = (change: { isPinned?: boolean; isMuted?: boolean; markedUnread?: boolean }) =>
    attempt(async () =>
      upsertConversation(queryClient, await updateMySettings(conversation.id, change)),
    );

  return {
    togglePin: () => patch({ isPinned: !conversation.isPinned }),
    toggleMute: () => patch({ isMuted: !conversation.isMuted }),
    setMarkedUnread: (value: boolean) => patch({ markedUnread: value }),

    /** Hides the history for me only; the other people keep their copy. */
    clear: () =>
      attempt(async () => {
        const updated = await clearConversation(conversation.id);
        clearMessages(queryClient, conversation.id);
        upsertConversation(queryClient, updated);
        pushToast("Messages cleared");
      }),

    /**
     * "Delete chat": a one-to-one chat is cleared (it returns with the next message); a group is
     * left, which removes it from the list.
     */
    deleteChat: () =>
      attempt(async () => {
        if (conversation.type === "group") {
          await removeMember(conversation.id, me.id);
          removeConversation(queryClient, conversation.id);
        } else {
          upsertConversation(queryClient, await clearConversation(conversation.id));
          clearMessages(queryClient, conversation.id);
        }
        if (openId === conversation.id) router.replace("/chats");
      }),
  };
}
