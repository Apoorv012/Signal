"use client";

import { Modal } from "@/components/ui/Modal";
import { useUiStore } from "@/stores/ui";

const SHORTCUTS: { keys: string[]; action: string }[] = [
  { keys: ["Alt", "N"], action: "New chat" },
  { keys: ["Ctrl", "F"], action: "Search in the open chat" },
  { keys: ["Ctrl", "Shift", "F"], action: "Search chats and messages" },
  { keys: ["Alt", "↑"], action: "Previous chat" },
  { keys: ["Alt", "↓"], action: "Next chat" },
  { keys: ["Enter"], action: "Send message" },
  { keys: ["Shift", "Enter"], action: "New line" },
  { keys: ["Esc"], action: "Close dialog, cancel reply or selection" },
  { keys: ["Ctrl", "/"], action: "Show this list" },
];

function Key({ children }: { children: string }) {
  return (
    <kbd className="bg-field text-text border-divider rounded-md border px-2 py-0.5 font-mono text-[0.8125rem]">
      {children}
    </kbd>
  );
}

/** Keyboard shortcut cheat sheet (Ctrl+/ or ?). On a Mac, Ctrl means Cmd. */
export function ShortcutsModal() {
  const closeModal = useUiStore((state) => state.closeModal);
  return (
    <Modal title="Keyboard shortcuts" onClose={closeModal}>
      <ul className="divide-divider divide-y px-4 py-1">
        {SHORTCUTS.map((shortcut) => (
          <li key={shortcut.action} className="flex items-center justify-between gap-4 py-3">
            <span className="text-text text-[0.9375rem]">{shortcut.action}</span>
            <span className="flex shrink-0 items-center gap-1">
              {shortcut.keys.map((key) => (
                <Key key={key}>{key}</Key>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
