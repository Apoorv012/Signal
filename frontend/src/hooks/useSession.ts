"use client";

import { useEffect, useState } from "react";

import { useSessionStore } from "@/stores/session";
import type { User } from "@/types";

/** True once the persisted session has been read from localStorage (client only). */
export function useSessionReady(): boolean {
  // Always false on the first render so server and client markup match; the store's `persist`
  // API does not exist during SSR (no localStorage), so it is only touched inside the effect.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { persist } = useSessionStore;
    if (persist.hasHydrated()) {
      setReady(true);
      return;
    }
    const unsubscribe = persist.onFinishHydration(() => setReady(true));
    void persist.rehydrate();
    return unsubscribe;
  }, []);

  return ready;
}

/** The signed-in user. Only call inside the authenticated area (guarded by RequireAuth). */
export function useCurrentUser(): User {
  const user = useSessionStore((state) => state.user);
  if (!user) throw new Error("useCurrentUser used outside an authenticated session");
  return user;
}
