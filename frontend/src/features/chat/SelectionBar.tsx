"use client";

import { Icon } from "@/components/icons/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { useMessages } from "@/hooks/useMessages";
import { useUiStore } from "@/stores/ui";
import type { Message } from "@/types";

interface SelectionBarProps {
  conversationId: number;
  ids: number[];
  onDelete: (messages: Message[]) => void;
}

/** Replaces the composer while messages are being selected: cancel, count, forward, delete. */
export function SelectionBar({ conversationId, ids, onDelete }: SelectionBarProps) {
  const { messages } = useMessages(conversationId);
  const clearSelection = useUiStore((state) => state.clearSelection);
  const openForward = useUiStore((state) => state.openForward);
  const selected = messages.filter((m) => ids.includes(m.id));

  return (
    <div className="bg-chat border-divider flex shrink-0 items-center gap-2 border-t px-3 py-2 pb-[max(env(safe-area-inset-bottom),8px)] md:px-5 md:py-3">
      <IconButton icon="x" label="Cancel selection" onClick={clearSelection} />
      <span className="text-text flex-1 text-[1rem] font-medium">{ids.length} selected</span>
      <button
        type="button"
        disabled={selected.length === 0}
        onClick={() => openForward(selected)}
        className="text-text hover:bg-hover flex items-center gap-2 rounded-lg px-3 py-2 text-[0.9375rem] disabled:opacity-40"
      >
        <Icon name="forward" size={22} />
        Forward
      </button>
      <button
        type="button"
        disabled={selected.length === 0}
        onClick={() => onDelete(selected)}
        className="text-danger hover:bg-hover flex items-center gap-2 rounded-lg px-3 py-2 text-[0.9375rem] disabled:opacity-40"
      >
        <Icon name="trash" size={22} />
        Delete
      </button>
    </div>
  );
}
