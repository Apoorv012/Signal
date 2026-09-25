"use client";

import { useQuery } from "@tanstack/react-query";

import { listContacts } from "@/lib/api/users";
import { queryKeys } from "@/lib/query/keys";
import type { User } from "@/types";

export function useContacts(): { contacts: User[]; isLoading: boolean } {
  // Contacts also grow on the server whenever someone messages you, so refetch on every use
  // (the pickers for new chats and groups) instead of trusting the 30 s default cache.
  const query = useQuery({
    queryKey: queryKeys.contacts,
    queryFn: listContacts,
    refetchOnMount: "always",
  });
  return { contacts: query.data ?? [], isLoading: query.isLoading };
}
