"use client";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useMessageActions } from "@/hooks/useMessageActions";
import type { Message } from "@/types";

/** "Delete for me" always; "Delete for everyone" only for my own messages from the last 24 h. */
export function DeleteMessagesDialog({
  messages,
  onClose,
}: {
  messages: Message[];
  onClose: () => void;
}) {
  const { canDeleteForEveryone, deleteMessages } = useMessageActions();
  const everyone = canDeleteForEveryone(messages);
  const noun = messages.length === 1 ? "message" : `${messages.length} messages`;

  const run = (forEveryone: boolean) => {
    onClose();
    void deleteMessages(messages, forEveryone);
  };

  return (
    <ConfirmDialog
      title={`Delete ${noun}?`}
      message={
        everyone
          ? "Delete it just for you, or remove it for everyone in this chat."
          : "It will be removed from your view only. Other people keep their copy."
      }
      confirmLabel={everyone ? "Delete for everyone" : "Delete for me"}
      onConfirm={() => run(everyone)}
      alternateLabel={everyone ? "Delete for me" : undefined}
      onAlternate={() => run(false)}
      onCancel={onClose}
    />
  );
}
