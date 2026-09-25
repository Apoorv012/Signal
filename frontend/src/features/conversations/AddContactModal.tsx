"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";
import { useUiStore } from "@/stores/ui";

export function AddContactModal() {
  const { openModal, closeModal, pushToast } = useUiStore();
  const [value, setValue] = useState("");
  const valid = value.trim().length >= 3;

  const submit = () => {
    pushToast(`${value.trim()} added to contacts`);
    closeModal();
  };

  return (
    <Modal
      title="Add contact"
      onClose={closeModal}
      onBack={() => openModal("new-chat")}
      footer={
        <Button fullWidth disabled={!valid} onClick={submit}>
          Add
        </Button>
      }
    >
      <form
        className="p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) submit();
        }}
      >
        <TextField
          id="contact"
          autoFocus
          label="Phone number or username"
          placeholder="+1 555 123 4567"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </form>
    </Modal>
  );
}
