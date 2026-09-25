/** Domain types. They mirror the backend API DTOs (camelCase) 1:1. */

export interface User {
  id: number;
  /** null for accounts registered with a username instead of a phone number. */
  phone: string | null;
  username: string | null;
  /** True when a username + password login is set up. */
  hasPassword: boolean;
  displayName: string;
  /** False until onboarding's name step is done (displayName then falls back to the phone / @username). */
  hasProfile: boolean;
  about: string;
  avatarUrl: string | null;
  /** Colour used for the sender name in group chats. */
  nameColor: string;
  lastSeenAt: string | null;
  isOnline: boolean;
}

export type ConversationType = "direct" | "group" | "note_to_self";
export type MemberRole = "admin" | "member";

/** "sending" / "failed" exist only on the client (optimistic send); the rest come from the server. */
export type MessageStatus = "sending" | "failed" | "sent" | "delivered" | "read";

export type MessageKind = "text" | "image" | "file" | "voice" | "system";

export interface Attachment {
  id: number;
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sizeLabel: string;
  width: number | null;
  height: number | null;
  /** Voice notes: duration in seconds. */
  durationSec: number | null;
}

export interface Reaction {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export interface QuotedMessage {
  id: number;
  senderName: string;
  preview: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number | null;
  kind: MessageKind;
  body: string;
  createdAt: string; // ISO 8601
  expiresAt: string | null;
  /** Only meaningful for messages sent by the current user. */
  status: MessageStatus;
  /** Set on my own messages; links an optimistic message to the server's copy. */
  clientId: string | null;
  attachment: Attachment | null;
  replyTo: QuotedMessage | null;
  reactions: Reaction[];
}

export interface LastMessage {
  kind: MessageKind;
  text: string;
  senderName: string | null;
  createdAt: string;
  /** Set when the last message was sent by me (shows the receipt icon in the list). */
  status: MessageStatus | null;
}

/** Per-chat look: Signal lets each conversation pick its own bubble colour / wallpaper. */
export interface ChatTheme {
  bubbleBackground: string;
  wallpaper: string | null;
}

export interface Member {
  user: User;
  role: MemberRole;
}

export interface Conversation {
  id: number;
  type: ConversationType;
  title: string;
  avatarUrl: string | null;
  isPinned: boolean;
  isMuted: boolean;
  unreadCount: number;
  /** Set by "Mark as unread"; cleared when the chat is opened. */
  markedUnread: boolean;
  /** Time of the last activity (message, system event or creation): the list sort key. */
  lastActivityAt: string;
  lastMessage: LastMessage | null;
  /** Seconds; null when disappearing messages are off. */
  disappearingSeconds: number | null;
  theme: ChatTheme | null;
  members: Member[];
  myRole: MemberRole;
}

/** A place this account is signed in ("linked device"). */
export interface Device {
  id: number;
  name: string;
  createdAt: string;
  lastActiveAt: string | null;
  isCurrent: boolean;
}

/** Simulated end-to-end encryption: the safety number of a one-to-one chat. */
export interface SafetyNumber {
  number: string;
  verified: boolean;
  peerName: string;
  simulated: boolean;
}

export interface AuthResult {
  token: string;
  user: User;
  isNewUser: boolean;
}

/** Server -> client WebSocket events (see backend/app/realtime/events.py). */
export type RealtimeEvent =
  | { type: "message.created"; data: Message }
  | {
      type: "message.status";
      data: { messageId: number; conversationId: number; status: MessageStatus };
    }
  | {
      type: "reaction.updated";
      data: { messageId: number; conversationId: number; reactions: Reaction[] };
    }
  | { type: "message.deleted"; data: { conversationId: number; messageIds: number[] } }
  | { type: "conversation.updated"; data: Conversation }
  | { type: "conversation.removed"; data: { conversationId: number } }
  | { type: "typing"; data: { conversationId: number; userId: number; isTyping: boolean } }
  | { type: "presence"; data: { userId: number; isOnline: boolean; lastSeenAt: string } }
  | { type: "pong"; data: Record<string, never> };
