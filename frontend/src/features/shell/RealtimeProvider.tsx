"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { wsUrl } from "@/lib/api/config";
import { realtime } from "@/lib/realtime/client";
import { handleEvent } from "@/lib/realtime/handleEvent";
import { RealtimeSocket } from "@/lib/realtime/socket";
import { useSessionStore } from "@/stores/session";

/** Keeps one WebSocket open while signed in and feeds its events into the query cache. */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const token = useSessionStore((state) => state.token);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;
    const socket = new RealtimeSocket(wsUrl(token), {
      onEvent: (event) => handleEvent(queryClient, event),
      // After a dropped connection we may have missed events: refetch instead of guessing.
      onOpen: (reconnected) => {
        if (reconnected) void queryClient.invalidateQueries();
      },
    });
    socket.connect();
    realtime.attach(socket);
    return () => {
      realtime.detach();
      socket.close();
    };
  }, [token, queryClient]);

  return children;
}
