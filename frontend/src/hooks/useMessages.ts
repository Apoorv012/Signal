"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { listMessages, PAGE_SIZE } from "@/lib/api/messages";
import { type MessagesPage, queryKeys } from "@/lib/query/keys";
import type { Message } from "@/types";

const NONE: Message[] = [];

/** Message history of one conversation (oldest first) with "load older" pagination. */
export function useMessages(conversationId: number) {
  const queryClient = useQueryClient();
  const key = queryKeys.messages(conversationId);

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<MessagesPage> => {
      const items = await listMessages(conversationId);
      return { items, hasMore: items.length === PAGE_SIZE };
    },
  });

  const loadOlder = useCallback(async () => {
    const page = queryClient.getQueryData<MessagesPage>(key);
    const oldest = page?.items.find((m) => m.id > 0);
    if (!page?.hasMore || !oldest) return;
    const older = await listMessages(conversationId, oldest.id);
    queryClient.setQueryData<MessagesPage>(key, {
      items: [...older, ...page.items],
      hasMore: older.length === PAGE_SIZE,
    });
  }, [queryClient, key, conversationId]);

  /** Loads older pages until `messageId` is in the cache. Resolves false if it never shows up. */
  const reveal = useCallback(
    async (messageId: number) => {
      for (;;) {
        const page = queryClient.getQueryData<MessagesPage>(key);
        if (!page) return false;
        if (page.items.some((m) => m.id === messageId)) return true;
        if (!page.hasMore) return false;
        await loadOlder();
      }
    },
    [queryClient, key, loadOlder],
  );

  return {
    messages: query.data?.items ?? NONE,
    hasMore: query.data?.hasMore ?? false,
    isLoading: query.isLoading,
    loadOlder,
    reveal,
  };
}
