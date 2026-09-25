"use client";

import { useQuery } from "@tanstack/react-query";

import { searchMessages } from "@/lib/api/messages";
import type { Message } from "@/types";

import { useDebounce } from "./useDebounce";

const NONE: Message[] = [];

/**
 * Debounced message search: within one chat when `conversationId` is given, else across all chats.
 * `term` is the trimmed query the results belong to (use it for highlighting).
 */
export function useMessageSearch(query: string, conversationId?: number) {
  const term = useDebounce(query.trim());
  const result = useQuery({
    queryKey: ["message-search", conversationId ?? "all", term],
    queryFn: () => searchMessages(term, conversationId),
    enabled: term.length > 0,
    staleTime: 15_000,
  });

  return {
    term,
    results: term ? (result.data ?? NONE) : NONE,
    // True while the debounce or the request is still catching up with what was typed.
    isSearching: query.trim() !== term || result.isFetching,
  };
}
