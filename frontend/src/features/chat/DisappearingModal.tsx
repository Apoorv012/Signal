"use client";

import { useQueryClient } from "@tanstack/react-query";

import { Icon } from "@/components/icons/Icon";
import { Modal } from "@/components/ui/Modal";
import { useConversation } from "@/hooks/useConversations";
import { updateConversation } from "@/lib/api/conversations";
import { upsertConversation } from "@/lib/query/cache";
import { useUiStore } from "@/stores/ui";

export const TIMER_CHOICES = [
  { label: "Off", seconds: 0 },
  { label: "30 seconds", seconds: 30 },
  { label: "5 minutes", seconds: 300 },
  { label: "1 hour", seconds: 3600 },
  { label: "8 hours", seconds: 28_800 },
  { label: "1 day", seconds: 86_400 },
  { label: "1 week", seconds: 604_800 },
];

/** Timer picker for one chat (direct or group): new messages disappear after the chosen time. */
export function DisappearingModal() {
  const queryClient = useQueryClient();
  const closeModal = useUiStore((state) => state.closeModal);
  const pushToast = useUiStore((state) => state.pushToast);
  const conversationId = useUiStore((state) => state.modalConversationId) ?? 0;
  const { conversation } = useConversation(conversationId);
  if (!conversation) return null;

  const current = conversation.disappearingSeconds ?? 0;

  const choose = async (seconds: number) => {
    if (seconds === current) return closeModal();
    try {
      const updated = await updateConversation(conversationId, { disappearingSeconds: seconds });
      upsertConversation(queryClient, updated);
      closeModal();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not change the timer");
    }
  };

  return (
    <Modal title="Disappearing messages" onClose={closeModal}>
      <p className="text-secondary px-4 pt-3 pb-1 text-[0.875rem]">
        New messages in this chat disappear after the chosen time, for everyone in it.
      </p>
      <ul role="radiogroup" aria-label="Timer">
        {TIMER_CHOICES.map((choice) => {
          const selected = choice.seconds === current;
          return (
            <li key={choice.seconds}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => void choose(choice.seconds)}
                className="hover:bg-hover flex w-full items-center justify-between px-4 py-3 text-left text-[1rem]"
              >
                <span className="text-text">{choice.label}</span>
                {selected && <Icon name="check" size={22} className="text-unread" />}
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
