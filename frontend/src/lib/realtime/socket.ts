import type { RealtimeEvent } from "@/types";

const HEARTBEAT_MS = 25_000;
const MAX_BACKOFF_MS = 10_000;

interface Handlers {
  onEvent: (event: RealtimeEvent) => void;
  /** Fired on every (re)connect; `reconnected` is true after a drop so callers can resync. */
  onOpen: (reconnected: boolean) => void;
}

/** WebSocket with automatic reconnect (exponential backoff) and a keep-alive ping. */
export class RealtimeSocket {
  private socket: WebSocket | null = null;
  private attempts = 0;
  private hasConnectedBefore = false;
  private closedByUs = false;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private heartbeat: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly url: string,
    private readonly handlers: Handlers,
  ) {}

  connect(): void {
    this.closedByUs = false;
    const socket = new WebSocket(this.url);
    this.socket = socket;

    socket.onopen = () => {
      this.attempts = 0;
      this.handlers.onOpen(this.hasConnectedBefore);
      this.hasConnectedBefore = true;
      this.heartbeat = setInterval(() => this.send({ type: "ping" }), HEARTBEAT_MS);
    };
    socket.onmessage = (message) => {
      try {
        this.handlers.onEvent(JSON.parse(message.data as string) as RealtimeEvent);
      } catch {
        // ignore malformed frames
      }
    };
    socket.onclose = () => {
      clearInterval(this.heartbeat);
      if (this.closedByUs) return;
      const delay = Math.min(1000 * 2 ** this.attempts++, MAX_BACKOFF_MS);
      this.retryTimer = setTimeout(() => this.connect(), delay);
    };
  }

  send(payload: Record<string, unknown>): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(payload));
  }

  close(): void {
    this.closedByUs = true;
    clearTimeout(this.retryTimer);
    clearInterval(this.heartbeat);
    this.socket?.close();
    this.socket = null;
  }
}
