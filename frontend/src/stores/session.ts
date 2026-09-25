import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { User } from "@/types";

interface SessionState {
  token: string | null;
  user: User | null;
  setSession: (token: string, user: User) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

/** Login session, persisted in localStorage so a page reload keeps you signed in. */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      clear: () => set({ token: null, user: null }),
    }),
    {
      name: "signal-session",
      // localStorage is not available during SSR: hydrate manually on the client (see useSessionReady).
      skipHydration: true,
    },
  ),
);
