"use client";

import { Icon } from "@/components/icons/Icon";
import { useUiStore } from "@/stores/ui";
import type { Conversation } from "@/types";

/** Signal's "end-to-end encrypted" line at the start of every chat (simulated in this demo). */
export function EncryptionNotice({ conversation }: { conversation: Conversation }) {
  const openModal = useUiStore((state) => state.openModal);
  const isDirect = conversation.type === "direct";

  return (
    <div className="text-secondary mx-auto mt-2 mb-3 flex max-w-[22rem] flex-col items-center gap-1 px-6 text-center text-[0.8125rem]">
      <span className="flex items-center gap-1.5">
        <Icon name="lock" size={14} />
        Messages are end-to-end encrypted
      </span>
      <span>No one outside of this chat can read them. (Simulated in this demo.)</span>
      {isDirect && (
        <button
          type="button"
          onClick={() => openModal("safety-number", conversation.id)}
          className="text-unread font-medium"
        >
          View safety number
        </button>
      )}
    </div>
  );
}
