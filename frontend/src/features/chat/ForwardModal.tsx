"use client";

import clsx from "clsx";
import { useState } from "react";

import { Icon } from "@/components/icons/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { useConversations } from "@/hooks/useConversations";
import { useMessageActions } from "@/hooks/useMessageActions";
import { useUiStore } from "@/stores/ui";

const MAX_TARGETS = 5; // same limit as Signal

/** Pick up to 5 chats to send the selected messages to. */
export function ForwardModal() {
  const closeModal = useUiStore((state) => state.closeModal);
  const messages = useUiStore((state) => state.forwardMessages);
  const { visible } = useConversations();
  const { forward } = useMessageActions();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const term = query.trim().toLowerCase();
  const chats = visible.filter((c) => c.title.toLowerCase().includes(term));

  const toggle = (id: number) =>
    setPicked((ids) =>
      ids.includes(id)
        ? ids.filter((x) => x !== id)
        : ids.length < MAX_TARGETS
          ? [...ids, id]
          : ids,
    );

  const send = async () => {
    setBusy(true);
    const ok = await forward(messages, picked);
    if (ok) closeModal();
    else setBusy(false);
  };

  return (
    <Modal
      title="Forward to"
      onClose={closeModal}
      footer={
        <Button fullWidth disabled={picked.length === 0 || busy} onClick={() => void send()}>
          {busy ? "Sending…" : picked.length > 0 ? `Send to ${picked.length}` : "Send"}
        </Button>
      }
    >
      <div className="p-4 pb-2">
        <SearchInput autoFocus value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {chats.map((chat) => {
        const selected = picked.includes(chat.id);
        return (
          <button
            key={chat.id}
            type="button"
            onClick={() => toggle(chat.id)}
            className="hover:bg-hover flex w-full items-center gap-3 px-4 py-2.5 text-left"
          >
            <Avatar name={chat.title} src={chat.avatarUrl} variant={chat.type} size={44} />
            <span className="text-text min-w-0 flex-1 truncate text-[1rem] font-medium">
              {chat.title}
            </span>
            <span
              className={clsx(
                "flex size-6 items-center justify-center rounded-full border-2",
                selected ? "border-unread bg-unread text-white" : "border-secondary/50",
              )}
            >
              {selected && <Icon name="check" size={16} />}
            </span>
          </button>
        );
      })}
      {chats.length === 0 && (
        <p className="text-secondary px-4 py-8 text-center text-[0.9375rem]">No chats found</p>
      )}
    </Modal>
  );
}
