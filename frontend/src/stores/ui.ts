import { create } from "zustand";

export type ModalId = "new-chat" | "add-contact" | "new-group";

export interface Toast {
  id: number;
  message: string;
}

interface UiState {
  modal: ModalId | null;
  toasts: Toast[];
  openModal: (modal: ModalId) => void;
  closeModal: () => void;
  pushToast: (message: string) => void;
  dismissToast: (id: number) => void;
}

const TOAST_MS = 3500;
let nextToastId = 1;

/** Transient UI state shared across features: which modal is open and the toast queue. */
export const useUiStore = create<UiState>((set, get) => ({
  modal: null,
  toasts: [],
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
  pushToast: (message) => {
    const id = nextToastId++;
    set((state) => ({ toasts: [...state.toasts, { id, message }] }));
    setTimeout(() => get().dismissToast(id), TOAST_MS);
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
