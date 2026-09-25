import type { Conversation, MemberRole } from "@/types";

import { request } from "./http";

export const listConversations = () => request<Conversation[]>("/conversations");

export const getConversation = (id: number) => request<Conversation>(`/conversations/${id}`);

export const createDirect = (userId: number) =>
  request<Conversation>("/conversations/direct", { method: "POST", body: { userId } });

export const createGroup = (title: string, memberIds: number[]) =>
  request<Conversation>("/conversations/group", { method: "POST", body: { title, memberIds } });

export const updateConversation = (
  id: number,
  patch: { title?: string; disappearingSeconds?: number },
) => request<Conversation>(`/conversations/${id}`, { method: "PATCH", body: patch });

export const updateMySettings = (
  id: number,
  patch: { isPinned?: boolean; isMuted?: boolean; chatTheme?: string },
) => request<Conversation>(`/conversations/${id}/me`, { method: "PATCH", body: patch });

export const addMembers = (id: number, userIds: number[]) =>
  request<Conversation>(`/conversations/${id}/members`, { method: "POST", body: { userIds } });

export const removeMember = (id: number, userId: number) =>
  request<Conversation | null>(`/conversations/${id}/members/${userId}`, { method: "DELETE" });

export const setMemberRole = (id: number, userId: number, role: MemberRole) =>
  request<Conversation>(`/conversations/${id}/members/${userId}`, {
    method: "PATCH",
    body: { role },
  });
