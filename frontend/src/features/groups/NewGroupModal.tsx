"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";
import { ContactRow } from "@/features/conversations/ContactRow";
import { useContacts } from "@/hooks/useContacts";
import { useUiStore } from "@/stores/ui";

type Step = "members" | "details";

/** Two-step group creation: pick members, then name the group. */
export function NewGroupModal() {
  const { openModal, closeModal, pushToast } = useUiStore();
  const contacts = useContacts();
  const [step, setStep] = useState<Step>("members");
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");

  const toggle = (id: string) =>
    setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  if (step === "details") {
    return (
      <Modal
        title="Name this group"
        onClose={closeModal}
        onBack={() => setStep("members")}
        footer={
          <Button
            fullWidth
            disabled={name.trim().length === 0}
            onClick={() => {
              pushToast(`Group "${name.trim()}" created`);
              closeModal();
            }}
          >
            Create
          </Button>
        }
      >
        <div className="flex flex-col gap-4 p-4">
          <TextField
            id="group-name"
            autoFocus
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
      {contacts.map((user) => (
        <ContactRow
          key={user.id}
          user={user}
          selected={selected.includes(user.id)}
          onSelect={() => toggle(user.id)}
        />
      ))}
    </Modal>
  );
}
