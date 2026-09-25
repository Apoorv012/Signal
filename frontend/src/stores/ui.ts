import { create } from "zustand";

export type ModalId = "new-chat" | "add-contact" | "new-group" | "group-info";

export interface Toast {
  id: number;
  /** Toasts with the same key replace each other instead of piling up. */
  key: string;
  message: string;
  /** Bold first line (e.g. the chat name for a message notification). */
  title?: string;
  /** How many events were merged into this toast (e.g. "3 new messages"). */
  count: number;
  /** Where tapping the toast goes. */
  href?: string;
}

export interface ToastOptions {
  key?: string;
  title?: string;
  href?: string;
}

/** A message the chat pane should scroll to and flash (from any search UI). */
export interface JumpTarget {
  conversationId: number;
  messageId: number;
  /** Text to highlight inside the bubble. */
  query: string;
}

interface UiState {
  modal: ModalId | null;
  /** Conversation a modal (e.g. group info) refers to. */
  modalConversationId: number | null;
  /** Conversation currently on screen; its incoming messages are marked read immediately. */
  activeConversationId: number | null;
  jumpTarget: JumpTarget | null;
  toasts: Toast[];
  requestJump: (target: JumpTarget) => void;
  /** Clears the jump target, but only if it belongs to `conversationId` (when given). */
  clearJump: (conversationId?: number) => void;
  openModal: (modal: ModalId, conversationId?: number) => void;
  closeModal: () => void;
  setActiveConversation: (id: number | null) => void;
  pushToast: (message: string, options?: ToastOptions) => void;
  dismissToast: (id: number) => void;
}

const TOAST_MS = 4000;
const MAX_TOASTS = 3;
let nextToastId = 1;
const timers = new Map<number, ReturnType<typeof setTimeout>>();

/** Transient UI state shared across features: open modal, active chat and the toast queue. */
export const useUiStore = create<UiState>((set, get) => {
  const schedule = (id: number) => {
    clearTimeout(timers.get(id));
    timers.set(
      id,
      setTimeout(() => get().dismissToast(id), TOAST_MS),
    );
  };

  return {
    modal: null,
    modalConversationId: null,
    activeConversationId: null,
    jumpTarget: null,
    toasts: [],
    requestJump: (target) => set({ jumpTarget: target }),
    clearJump: (conversationId) =>
      set((state) =>
        conversationId === undefined || state.jumpTarget?.conversationId === conversationId
          ? { jumpTarget: null }
          : state,
      ),
    openModal: (modal, conversationId) =>
      set({ modal, modalConversationId: conversationId ?? get().modalConversationId }),
    closeModal: () => set({ modal: null }),
    setActiveConversation: (id) => set({ activeConversationId: id }),

    /**
     * Shows a toast. A toast with the same key (default: the same text) is merged into the
     * existing one (count + 1, timer restarted); at most MAX_TOASTS are visible at once.
     */
    pushToast: (message, options = {}) => {
      const key = options.key ?? message;
      const existing = get().toasts.find((t) => t.key === key);

      if (existing) {
        set((state) => ({
          toasts: state.toasts.map((t) =>
            t.id === existing.id ? { ...t, message, count: t.count + 1 } : t,
          ),
        }));
        schedule(existing.id);
        return;
      }

      const id = nextToastId++;
      const toast: Toast = { id, key, message, title: options.title, href: options.href, count: 1 };
      const kept = [...get().toasts, toast];
      const dropped = kept.slice(0, Math.max(0, kept.length - MAX_TOASTS));
      dropped.forEach((t) => clearTimeout(timers.get(t.id)));
      set({ toasts: kept.slice(dropped.length) });
      schedule(id);
    },

    dismissToast: (id) => {
      clearTimeout(timers.get(id));
      timers.delete(id);
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    },
  };
});
