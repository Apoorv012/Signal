"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useCurrentUser } from "@/hooks/useSession";
import { sendMessage } from "@/lib/api/messages";
import { newClientId } from "@/lib/ids";
import { upsertMessage } from "@/lib/query/cache";
import { type MessagesPage, queryKeys } from "@/lib/query/keys";
import { useUiStore } from "@/stores/ui";
import type { Attachment, Message, QuotedMessage } from "@/types";

export interface OutgoingDraft {
  body: string;
  attachment?: Attachment;
  replyTo?: QuotedMessage & { id: number };
}

function kindFor(attachment?: Attachment): Message["kind"] {
  if (!attachment) return "text";
  if (attachment.mimeType.startsWith("image/")) return "image";
  if (attachment.mimeType.startsWith("audio/")) return "voice";
  return "file";
}

/**
 * Optimistic send: the message appears instantly as "sending", then is replaced by the server's
 * copy (matched by clientId). A failure leaves it as "failed" so the user can retry.
 */
export function useSendMessage(conversationId: number) {
  const queryClient = useQueryClient();
  const me = useCurrentUser();

  const deliver = useCallback(
    async (clientId: string, draft: OutgoingDraft) => {
      const ctx = { meId: me.id, activeConversationId: conversationId };
      try {
        const saved = await sendMessage(conversationId, {
          clientId,
          body: draft.body,
          replyToId: draft.replyTo?.id,
          attachmentId: draft.attachment?.id,
        });
        upsertMessage(queryClient, saved, ctx);
      } catch (error) {
        queryClient.setQueryData<MessagesPage>(queryKeys.messages(conversationId), (page) =>
          page
            ? {
                ...page,
                items: page.items.map((m) =>
                  m.clientId === clientId ? { ...m, status: "failed" as const } : m,
                ),
              }
            : page,
        );
        useUiStore
          .getState()
          .pushToast(error instanceof Error ? error.message : "Message not sent");
      }
    },
    [queryClient, conversationId, me.id],
  );

  const send = useCallback(
    async (draft: OutgoingDraft) => {
      const clientId = newClientId();
      const optimistic: Message = {
        id: -Date.now(), // temporary; replaced by the real id when the server responds
        conversationId,
        senderId: me.id,
        kind: kindFor(draft.attachment),
        body: draft.body.trim(),
        createdAt: new Date().toISOString(),
        expiresAt: null,
        status: "sending",
        clientId,
        attachment: draft.attachment ?? null,
        replyTo: draft.replyTo ?? null,
        reactions: [],
      };
      upsertMessage(queryClient, optimistic, { meId: me.id, activeConversationId: conversationId });
      await deliver(clientId, draft);
    },
    [queryClient, conversationId, me.id, deliver],
  );

  const retry = useCallback(
    async (message: Message) => {
      if (!message.clientId) return;
      queryClient.setQueryData<MessagesPage>(queryKeys.messages(conversationId), (page) =>
        page
          ? {
              ...page,
              items: page.items.map((m) =>
                m.clientId === message.clientId ? { ...m, status: "sending" as const } : m,
              ),
            }
          : page,
      );
      await deliver(message.clientId, {
        body: message.body,
        attachment: message.attachment ?? undefined,
        replyTo: message.replyTo ?? undefined,
      });
    },
    [queryClient, conversationId, deliver],
  );

  return { send, retry };
}
