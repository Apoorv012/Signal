"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { useContacts } from "@/hooks/useContacts";
import { CONVERSATIONS } from "@/mocks/conversations";
import { useUiStore } from "@/stores/ui";

import { ActionRow, ContactRow } from "./ContactRow";

export function NewChatModal() {
  const router = useRouter();
  const { openModal, closeModal, pushToast } = useUiStore();
  const [query, setQuery] = useState("");
  const contacts = useContacts().filter((c) =>
    c.displayName.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const startChat = (userId: string) => {
    closeModal();
    const existing = CONVERSATIONS.find((c) => c.type === "direct" && c.memberIds.includes(userId));
    if (existing) router.push(`/chats/${existing.id}`);
    else pushToast("New conversation started");
  };

  return (
    <Modal title="New message" onClose={closeModal}>
      <div className="p-4 pb-2">
        <SearchInput autoFocus value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {!query && (
        <>
          <ActionRow icon="group" label="New group" onSelect={() => openModal("new-group")} />
          <ActionRow
            icon="person-plus-compact"
            label="Add contact"
            onSelect={() => openModal("add-contact")}
          />
        </>
      )}
      <h3 className="text-secondary px-4 pt-3 pb-1 text-[0.875rem] font-medium">Contacts</h3>
      {contacts.map((user) => (
        <ContactRow key={user.id} user={user} onSelect={() => startChat(user.id)} />
      ))}
      {contacts.length === 0 && (
        <p className="text-secondary px-4 py-8 text-center text-[0.9375rem]">No contacts found</p>
      )}
    </Modal>
  );
}
