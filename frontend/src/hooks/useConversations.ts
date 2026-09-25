"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { getConversation, listConversations } from "@/lib/api/conversations";
import { queryKeys } from "@/lib/query/keys";
import type { Conversation } from "@/types";

/** All conversations (server order: newest activity first), split into pinned and the rest. */
export function useConversations() {
  const query = useQuery({ queryKey: queryKeys.conversations, queryFn: listConversations });
  const all = query.data;

  return useMemo(() => {
    const list = all ?? [];
    return {
      all: list,
      pinned: list.filter((c) => c.isPinned),
      others: list.filter((c) => !c.isPinned),
      isLoading: query.isLoading,
    };
  }, [all, query.isLoading]);
}

export function useConversation(id: number): {
  conversation: Conversation | undefined;
  isLoading: boolean;
} {
  const { all, isLoading: listLoading } = useConversations();
  const inList = all.find((c) => c.id === id);

  // A one-to-one chat with no messages yet is not in the list (the server hides it until the
  // first message), but you can still be looking at it right after starting it: load it by id.
  const fallback = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => getConversation(id),
    enabled: !listLoading && !inList,
    retry: false,
  });

  return {
    conversation: inList ?? fallback.data,
    isLoading: listLoading || (!inList && fallback.isLoading),
  };
}

export function useTotalUnread(): number {
  const { all } = useConversations();
  return all.filter((c) => c.unreadCount > 0 && !c.isMuted).length;
}
