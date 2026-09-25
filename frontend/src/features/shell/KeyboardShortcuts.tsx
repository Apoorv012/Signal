"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useConversations } from "@/hooks/useConversations";
import { useUiStore } from "@/stores/ui";

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  target.closest("input, textarea, select, [contenteditable=true]");

/**
 * Global keyboard shortcuts (desktop). The list is shown in the Shortcuts modal, keep them in sync:
 *   Alt+N        new chat            Ctrl+F        search in this chat (else the chat list)
 *   Ctrl+Shift+F search chats        Alt+Up/Down   previous / next chat
 *   Ctrl+/ or ?  show shortcuts      Esc           close a dialog, cancel a reply or selection
 * Browsers reserve Ctrl+N (new window) and Ctrl+T, so "new chat" uses Alt+N instead.
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const { visible } = useConversations();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const ui = useUiStore.getState();
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      const focusListSearch = () => {
        document.getElementById("chat-list-search")?.focus();
      };

      if (event.altKey && !mod && key === "n") {
        event.preventDefault();
        ui.openModal("new-chat");
      } else if (mod && key === "f") {
        event.preventDefault();
        if (event.shiftKey || ui.activeConversationId === null) focusListSearch();
        else ui.requestChatSearch();
      } else if (event.altKey && (key === "arrowup" || key === "arrowdown")) {
        event.preventDefault();
        const at = visible.findIndex((c) => c.id === ui.activeConversationId);
        const next = key === "arrowdown" ? at + 1 : at - 1;
        const target = visible[at === -1 ? 0 : Math.min(Math.max(next, 0), visible.length - 1)];
        if (target) router.push(`/chats/${target.id}`);
      } else if ((mod && key === "/") || (key === "?" && !mod && !isTyping(event.target))) {
        event.preventDefault();
        ui.openModal("shortcuts");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router, visible]);

  return null;
}
