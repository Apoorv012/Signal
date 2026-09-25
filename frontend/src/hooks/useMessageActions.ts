"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/hooks/useSession";
import { deleteMessages as deleteMessagesRequest, sendMessage } from "@/lib/api/messages";
import { newClientId } from "@/lib/ids";
import { removeMessages, upsertMessage } from "@/lib/query/cache";
import { queryKeys } from "@/lib/query/keys";
import { useUiStore } from "@/stores/ui";
import type { Message } from "@/types";

const DELETE_FOR_EVERYONE_MS = 24 * 3600 * 1000; // same window as the server

/** Message-level actions from the right-click menu and the selection bar. */
export function useMessageActions() {
  const queryClient = useQueryClient();
  const me = useCurrentUser();
  const pushToast = useUiStore((state) => state.pushToast);
  const clearSelection = useUiStore((state) => state.clearSelection);

  /** Only my own, recent, real messages can be deleted for everyone. */
  const canDeleteForEveryone = (messages: Message[]) =>
    messages.every(
      (m) =>
        m.senderId === me.id &&
        m.kind !== "system" &&
        Date.now() - Date.parse(m.createdAt) < DELETE_FOR_EVERYONE_MS,
    );

  const deleteMessages = async (messages: Message[], forEveryone: boolean) => {
    try {
      await deleteMessagesRequest(
        messages.map((m) => m.id),
        forEveryone,
      );
      for (const conversationId of new Set(messages.map((m) => m.conversationId))) {
        removeMessages(
          queryClient,
          conversationId,
          messages.filter((m) => m.conversationId === conversationId).map((m) => m.id),
        );
      }
      // Previews and unread counts in the list may have changed.
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      clearSelection();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not delete");
    }
  };

  /** Sends a copy of each text message to every chosen chat. Attachments cannot be forwarded yet. */
  const forward = async (messages: Message[], conversationIds: number[]): Promise<boolean> => {
    const sendable = messages.filter((m) => m.body.length > 0);
    if (sendable.length < messages.length) pushToast("Attachments cannot be forwarded yet");
    if (sendable.length === 0) return false;
    try {
      for (const conversationId of conversationIds) {
        for (const message of sendable) {
          const sent = await sendMessage(conversationId, {
            clientId: newClientId(),
            body: message.body,
          });
          upsertMessage(queryClient, sent, {
            meId: me.id,
            activeConversationId: useUiStore.getState().activeConversationId,
          });
        }
      }
      pushToast(
        conversationIds.length === 1
          ? "Message forwarded"
          : `Forwarded to ${conversationIds.length} chats`,
      );
      clearSelection();
      return true;
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not forward");
      return false;
    }
  };

  return { canDeleteForEveryone, deleteMessages, forward };
}
