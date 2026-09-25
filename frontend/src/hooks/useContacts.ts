"use client";

import { useQuery } from "@tanstack/react-query";

import { listContacts } from "@/lib/api/users";
import { queryKeys } from "@/lib/query/keys";
import type { User } from "@/types";

export function useContacts(): { contacts: User[]; isLoading: boolean } {
  const query = useQuery({ queryKey: queryKeys.contacts, queryFn: listContacts });
  return { contacts: query.data ?? [], isLoading: query.isLoading };
}
