"use client";

import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PhoneField, usePhoneInput } from "@/components/ui/PhoneField";
import { TextField } from "@/components/ui/TextField";
import { addContact } from "@/lib/api/users";
import { queryKeys } from "@/lib/query/keys";
import { useUiStore } from "@/stores/ui";

type Mode = "phone" | "username";

/** Add a contact by phone number (country code + number) or by @username. */
export function AddContactModal() {
  const queryClient = useQueryClient();
  const { openModal, closeModal, pushToast } = useUiStore();
  const phone = usePhoneInput();
  const [mode, setMode] = useState<Mode>("phone");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const cleanUsername = username.trim().replace(/^@/, "");
  const valid = mode === "phone" ? phone.valid : cleanUsername.length >= 3;

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    try {
      const user = await addContact(mode === "phone" ? phone.e164 : `@${cleanUsername}`);
      await queryClient.invalidateQueries({ queryKey: queryKeys.contacts });
      pushToast(`${user.displayName} added to contacts`);
      openModal("new-chat");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add contact");
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Add contact"
      onClose={closeModal}
      onBack={() => openModal("new-chat")}
      footer={
        <Button fullWidth disabled={!valid || busy} onClick={() => void submit()}>
          {busy ? "Adding…" : "Add"}
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div role="tablist" className="bg-field flex rounded-full p-1">
          {(["phone", "username"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={mode === option}
              onClick={() => {
                setMode(option);
                setError(undefined);
              }}
              className={clsx(
                "flex-1 rounded-full py-2 text-[0.9375rem] font-medium transition-colors",
                mode === option ? "bg-chat text-text shadow-sm" : "text-secondary",
              )}
            >
              {option === "phone" ? "Phone number" : "Username"}
            </button>
          ))}
        </div>

        {mode === "phone" ? (
          <PhoneField
            state={phone}
            error={error}
            disabled={busy}
            autoFocus
            onChange={() => setError(undefined)}
          />
        ) : (
          <TextField
            id="contact-username"
            autoFocus
            disabled={busy}
            placeholder="@username"
            value={username}
            error={error}
            onChange={(e) => {
              setError(undefined);
              setUsername(e.target.value);
            }}
          />
        )}
      </form>
    </Modal>
  );
}
