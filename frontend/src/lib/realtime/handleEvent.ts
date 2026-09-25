import type { QueryClient } from "@tanstack/react-query";

import { findMember } from "@/lib/chat/conversation";
import { previewText } from "@/lib/chat/preview";
import {
  removeConversation,
  updateMessageStatus,
  updateReactions,
  upsertConversation,
  upsertMessage,
} from "@/lib/query/cache";
import { queryKeys } from "@/lib/query/keys";
import { usePresenceStore } from "@/stores/presence";
import { useSessionStore } from "@/stores/session";
import { useUiStore } from "@/stores/ui";
import type { Conversation, RealtimeEvent } from "@/types";

/** Applies one server event to the query cache / stores. The only place events are interpreted. */
export function handleEvent(qc: QueryClient, event: RealtimeEvent): void {
  const meId = useSessionStore.getState().user?.id;
  if (meId === undefined) return;
  const ui = useUiStore.getState();

  switch (event.type) {
    case "message.created": {
      const message = event.data;
      upsertMessage(qc, message, { meId, activeConversationId: ui.activeConversationId });
      notifyIncoming(qc, event.data.conversationId, message, meId, ui.activeConversationId);
      break;
    }
    case "message.status":
      updateMessageStatus(qc, event.data);
      break;
    case "reaction.updated":
      updateReactions(qc, event.data);
      break;
    case "conversation.updated":
      upsertConversation(qc, event.data);
      break;
    case "conversation.removed":
      removeConversation(qc, event.data.conversationId);
      break;
    case "typing":
      usePresenceStore
        .getState()
        .setTyping(event.data.conversationId, event.data.userId, event.data.isTyping);
      break;
    case "presence":
      usePresenceStore.getState().setPresence(event.data.userId, {
        isOnline: event.data.isOnline,
        lastSeenAt: event.data.lastSeenAt,
      });
      break;
  }
}

/** Toast for messages that arrive in a chat you are not looking at (and did not mute). */
function notifyIncoming(
  qc: QueryClient,
  conversationId: number,
  message: Extract<RealtimeEvent, { type: "message.created" }>["data"],
  meId: number,
  activeConversationId: number | null,
): void {
  if (message.senderId === meId || message.kind === "system") return;
  if (activeConversationId === conversationId && document.visibilityState === "visible") return;

  const conversation = qc
    .getQueryData<Conversation[]>(queryKeys.conversations)
    ?.find((c) => c.id === conversationId);
  if (!conversation || conversation.isMuted) return;

  const sender = findMember(conversation, message.senderId);
  const preview = previewText(message);
  // One notification per chat: further messages bump its counter instead of stacking up.
  useUiStore
    .getState()
    .pushToast(
      conversation.type === "group" && sender
        ? `${sender.displayName.split(" ")[0]}: ${preview}`
        : preview,
      {
        key: `chat:${conversationId}`,
        title: conversation.title,
        href: `/chats/${conversationId}`,
      },
    );
}
