"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { useContacts } from "@/hooks/useContacts";
import { useDebounce } from "@/hooks/useDebounce";
import { useCurrentUser } from "@/hooks/useSession";
import { createDirect } from "@/lib/api/conversations";
import { searchUsers } from "@/lib/api/users";
import { upsertConversation } from "@/lib/query/cache";
import { useUiStore } from "@/stores/ui";
import type { User } from "@/types";

import { ActionRow, ContactRow } from "./ContactRow";

/** "New message": search registered users (or browse contacts) and open a direct chat. */
export function NewChatModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useCurrentUser();
  const { openModal, closeModal, pushToast } = useUiStore();
  const { contacts } = useContacts();
  const [query, setQuery] = useState("");
  const term = useDebounce(query.trim());

  const search = useQuery({
    queryKey: ["user-search", term],
    queryFn: () => searchUsers(term),
    enabled: term.length >= 2,
  });
  const searching = query.trim().length > 0;
  const users: User[] = searching ? (search.data ?? []) : contacts;

  const startChat = async (user: User) => {
    try {
      const conversation = await createDirect(user.id);
      // An empty one-to-one chat is not listed until the first message is sent.
      if (conversation.lastMessage) upsertConversation(queryClient, conversation);
      closeModal();
      router.push(`/chats/${conversation.id}`);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not start the chat");
    }
  };

  return (
    <Modal title="New message" onClose={closeModal}>
      <div className="p-4 pb-2">
        <SearchInput
          autoFocus
          placeholder="Search name, username or number"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {!searching && (
        <>
          <ActionRow icon="group" label="New group" onSelect={() => openModal("new-group")} />
          <ActionRow
            icon="person-plus-compact"
            label="Add contact"
            onSelect={() => openModal("add-contact")}
          />
          <ActionRow icon="note" label="Note to Self" onSelect={() => void startChat(me)} />
        </>
      )}
      <h3 className="text-secondary px-4 pt-3 pb-1 text-[0.875rem] font-medium">
        {searching ? "Results" : "Contacts"}
      </h3>
      {users.map((user) => (
        <ContactRow key={user.id} user={user} onSelect={() => void startChat(user)} />
      ))}
      {users.length === 0 && !search.isFetching && (
        <p className="text-secondary px-4 py-8 text-center text-[0.9375rem]">
          {searching ? "No users found" : "No contacts yet. Add one to get started."}
        </p>
      )}
    </Modal>
  );
}
