/**
 * Pure helpers that patch the TanStack Query cache. They are shared by the HTTP mutations
 * (optimistic updates) and the WebSocket handler, so both paths produce identical state.
 */
import type { QueryClient } from "@tanstack/react-query";

import { findMember } from "@/lib/chat/conversation";
import { previewText } from "@/lib/chat/preview";
import type { Conversation, Message, MessageStatus, Reaction } from "@/types";

import { type MessagesPage, queryKeys } from "./keys";

const STATUS_RANK: Record<MessageStatus, number> = {
  failed: -1,
  sending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
};

/** Receipts only move forward (a late "delivered" event must not undo "read"). */
const advance = (current: MessageStatus, next: MessageStatus): MessageStatus =>
  STATUS_RANK[next] > STATUS_RANK[current] ? next : current;

/**
 * Newest activity first. This must match the server's ordering (last_message_at), otherwise the
 * list would reshuffle depending on whether it came from a fetch or a live update.
 */
export function sortConversations(list: Conversation[]): Conversation[] {
  // Compare real timestamps: server and client format ISO strings differently (".348000Z" vs ".348Z").
  const time = (c: Conversation) => Date.parse(c.lastActivityAt);
  return [...list].sort((a, b) => time(b) - time(a) || b.id - a.id);
}

interface UpsertContext {
  meId: number;
  /** Conversation currently on screen: its incoming messages are read immediately. */
  activeConversationId: number | null;
}

/** Inserts (or updates) a message in its history and refreshes the conversation list row. */
export function upsertMessage(qc: QueryClient, message: Message, ctx: UpsertContext): void {
  const messagesKey = queryKeys.messages(message.conversationId);
  const page = qc.getQueryData<MessagesPage>(messagesKey);
  const known = page?.items.some(
    (m) => m.id === message.id || (message.clientId !== null && m.clientId === message.clientId),
  );

  if (page) {
    qc.setQueryData<MessagesPage>(messagesKey, {
      ...page,
      items: known
        ? page.items.map((m) =>
            m.id === message.id || (message.clientId !== null && m.clientId === message.clientId)
              ? { ...message, status: advance(m.status, message.status) }
              : m,
          )
        : [...page.items, message],
    });
  }

  const conversations = qc.getQueryData<Conversation[]>(queryKeys.conversations);
  const conversation = conversations?.find((c) => c.id === message.conversationId);
  if (!conversations) return;
  if (!conversation) {
    void qc.invalidateQueries({ queryKey: queryKeys.conversations }); // e.g. a chat we do not know yet
    return;
  }

  const outgoing = message.senderId === ctx.meId;
  const sender = findMember(conversation, message.senderId);
  const countsAsUnread =
    !known &&
    !outgoing &&
    message.kind !== "system" &&
    ctx.activeConversationId !== message.conversationId;

  const updated: Conversation = {
    ...conversation,
    unreadCount: conversation.unreadCount + (countsAsUnread ? 1 : 0),
    lastActivityAt: message.createdAt,
    lastMessage: {
      kind: message.kind,
      text: previewText(message),
      senderName:
        conversation.type === "group" && !outgoing && sender
          ? sender.displayName.split(" ")[0]
          : null,
      createdAt: message.createdAt,
      status: outgoing ? message.status : null,
    },
  };
  qc.setQueryData(
    queryKeys.conversations,
    sortConversations(conversations.map((c) => (c.id === updated.id ? updated : c))),
  );
}

export function updateMessageStatus(
  qc: QueryClient,
  event: { messageId: number; conversationId: number; status: MessageStatus },
): void {
  const key = queryKeys.messages(event.conversationId);
  const page = qc.getQueryData<MessagesPage>(key);
  if (!page) return;
  qc.setQueryData<MessagesPage>(key, {
    ...page,
    items: page.items.map((m) =>
      m.id === event.messageId ? { ...m, status: advance(m.status, event.status) } : m,
    ),
  });

  // Keep the tick in the conversation list in sync when the newest message changed state.
  const newest = page.items[page.items.length - 1];
  if (newest?.id !== event.messageId) return;
  qc.setQueryData<Conversation[]>(queryKeys.conversations, (list) =>
    list?.map((c) =>
      c.id === event.conversationId && c.lastMessage?.status
        ? {
            ...c,
            lastMessage: { ...c.lastMessage, status: advance(c.lastMessage.status, event.status) },
          }
        : c,
    ),
  );
}

export function updateReactions(
  qc: QueryClient,
  event: { messageId: number; conversationId: number; reactions: Reaction[] },
): void {
  const key = queryKeys.messages(event.conversationId);
  qc.setQueryData<MessagesPage>(key, (page) =>
    page
      ? {
          ...page,
          items: page.items.map((m) =>
            m.id === event.messageId ? { ...m, reactions: event.reactions } : m,
          ),
        }
      : page,
  );
}

export function upsertConversation(qc: QueryClient, conversation: Conversation): void {
  qc.setQueryData<Conversation[]>(queryKeys.conversations, (list) => {
    if (!list) return list;
    const exists = list.some((c) => c.id === conversation.id);
    return sortConversations(
      exists
        ? list.map((c) => (c.id === conversation.id ? conversation : c))
        : [...list, conversation],
    );
  });
}

export function removeConversation(qc: QueryClient, conversationId: number): void {
  qc.setQueryData<Conversation[]>(queryKeys.conversations, (list) =>
    list?.filter((c) => c.id !== conversationId),
  );
  qc.removeQueries({ queryKey: queryKeys.messages(conversationId) });
}

export function clearUnread(qc: QueryClient, conversationId: number): void {
  qc.setQueryData<Conversation[]>(queryKeys.conversations, (list) =>
    list?.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
  );
}
