import { RealtimeSocket } from "./socket";

/** The single app-wide socket, started/stopped by RealtimeProvider. */
let current: RealtimeSocket | null = null;

export const realtime = {
  attach(socket: RealtimeSocket): void {
    current = socket;
  },
  detach(): void {
    current = null;
  },
  sendTyping(conversationId: number, isTyping: boolean): void {
    current?.send({ type: "typing", conversationId, isTyping });
  },
};
