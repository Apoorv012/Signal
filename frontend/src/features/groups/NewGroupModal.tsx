"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { TextField } from "@/components/ui/TextField";
import { ContactRow } from "@/features/conversations/ContactRow";
import { useContacts } from "@/hooks/useContacts";
import { filterUsers } from "@/lib/chat/users";
import { createGroup } from "@/lib/api/conversations";
import { upsertConversation } from "@/lib/query/cache";
import { useUiStore } from "@/stores/ui";

type Step = "members" | "details";

/** Two-step group creation: pick members from your contacts, then name the group. */
export function NewGroupModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { openModal, closeModal, pushToast } = useUiStore();
  const { contacts } = useContacts();
  const [step, setStep] = useState<Step>("members");
  const [selected, setSelected] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (id: number) =>
    setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const create = async () => {
    setBusy(true);
    try {
      const group = await createGroup(name.trim(), selected);
      upsertConversation(queryClient, group);
      closeModal();
      router.push(`/chats/${group.id}`);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not create the group");
      setBusy(false);
    }
  };

  if (step === "details") {
    return (
      <Modal
        title="Name this group"
        onClose={closeModal}
        onBack={() => setStep("members")}
        footer={
          <Button
            fullWidth
            disabled={name.trim().length === 0 || busy}
            onClick={() => void create()}
          >
            {busy ? "Creating…" : "Create"}
          </Button>
        }
      >
        <div className="flex flex-col gap-4 p-4">
          <TextField
            id="group-name"
            autoFocus
            maxLength={100}
            label="Group name (required)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="text-secondary text-[0.875rem]">
            {selected.length} member{selected.length === 1 ? "" : "s"} selected
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="New group"
      onClose={closeModal}
      onBack={() => openModal("new-chat")}
      footer={
        <Button fullWidth disabled={selected.length === 0} onClick={() => setStep("details")}>
          Next
        </Button>
      }
    >
      <div className="p-4 pb-2">
        <SearchInput
          placeholder="Search contacts"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {filterUsers(contacts, query).map((user) => (
        <ContactRow
          key={user.id}
          user={user}
          selected={selected.includes(user.id)}
          onSelect={() => toggle(user.id)}
        />
      ))}
      {contacts.length === 0 && (
        <p className="text-secondary px-4 py-8 text-center text-[0.9375rem]">
          Add some contacts first to create a group.
        </p>
      )}
      {contacts.length > 0 && filterUsers(contacts, query).length === 0 && (
        <p className="text-secondary px-4 py-8 text-center text-[0.9375rem]">No contacts match</p>
      )}
    </Modal>
  );
}
