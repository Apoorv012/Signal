import type { Attachment, Message } from "@/types";

import { request } from "./http";

export const PAGE_SIZE = 50;

export const listMessages = (conversationId: number, before?: number) =>
  request<Message[]>(`/conversations/${conversationId}/messages`, {
    query: { before, limit: PAGE_SIZE },
  });

export interface SendMessagePayload {
  clientId: string;
  body: string;
  replyToId?: number;
  attachmentId?: number;
}

export const sendMessage = (conversationId: number, payload: SendMessagePayload) =>
  request<Message>(`/conversations/${conversationId}/messages`, { method: "POST", body: payload });

export const markRead = (conversationId: number, upToMessageId: number) =>
  request<void>(`/conversations/${conversationId}/read`, {
    method: "POST",
    body: { upToMessageId },
  });

export const setReaction = (messageId: number, emoji: string) =>
  request<Message>(`/messages/${messageId}/reaction`, { method: "PUT", body: { emoji } });

export const removeReaction = (messageId: number) =>
  request<Message>(`/messages/${messageId}/reaction`, { method: "DELETE" });

export const uploadAttachment = (file: File | Blob, fileName: string, durationSec?: number) => {
  const form = new FormData();
  form.append("file", file, fileName);
  if (durationSec !== undefined) form.append("durationSec", String(durationSec));
  return request<Attachment>("/attachments", { method: "POST", form });
};
