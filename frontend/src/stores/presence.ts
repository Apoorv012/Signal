import { create } from "zustand";

interface Presence {
  isOnline: boolean;
  lastSeenAt: string | null;
}

interface PresenceState {
  /** Live overrides pushed over the WebSocket; the API's `isOnline` is only a snapshot. */
  presence: Record<number, Presence>;
  /** conversationId -> ids of users currently typing there. */
  typing: Record<number, number[]>;
  setPresence: (userId: number, presence: Presence) => void;
  setTyping: (conversationId: number, userId: number, isTyping: boolean) => void;
}

const TYPING_TTL_MS = 6000; // a lost "stopped typing" event must not leave the dots up forever
const timers = new Map<string, ReturnType<typeof setTimeout>>();

export const usePresenceStore = create<PresenceState>((set, get) => ({
  presence: {},
  typing: {},
  setPresence: (userId, presence) =>
    set((state) => ({ presence: { ...state.presence, [userId]: presence } })),
  setTyping: (conversationId, userId, isTyping) => {
    const timerKey = `${conversationId}:${userId}`;
    clearTimeout(timers.get(timerKey));
    timers.delete(timerKey);

    const others = (get().typing[conversationId] ?? []).filter((id) => id !== userId);
    set((state) => ({
      typing: { ...state.typing, [conversationId]: isTyping ? [...others, userId] : others },
    }));

    if (isTyping) {
      timers.set(
        timerKey,
        setTimeout(() => get().setTyping(conversationId, userId, false), TYPING_TTL_MS),
      );
    }
  },
}));
