/** Domain types shared by hooks and components. They mirror the backend API DTOs. */

export interface User {
  id: string;
  displayName: string;
  avatarUrl?: string;
  /** Colour used for the sender name in group chats. */
  nameColor: string;
}

export type ConversationType = "direct" | "group" | "note_to_self";

/** sending exists only on the client (optimistic send); the rest come from the server. */
export type MessageStatus = "sending" | "sent" | "delivered" | "read";

export type MessageKind = "text" | "image" | "file" | "voice" | "system";

export interface Attachment {
  url?: string;
  fileName?: string;
  sizeLabel?: string;
  /** Voice notes: duration in seconds. */
  durationSec?: number;
  width?: number;
  height?: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export interface QuotedMessage {
  id: string;
  senderName: string;
  preview: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  kind: MessageKind;
  body: string;
  createdAt: string; // ISO 8601
  /** Only meaningful for messages sent by the current user. */
  status: MessageStatus;
  attachment?: Attachment;
  replyTo?: QuotedMessage;
  reactions: Reaction[];
}

export interface LastMessagePreview {
  kind: MessageKind;
  text: string;
  senderName?: string;
  createdAt: string;
  /** Set when the last message was sent by me (shows the receipt icon in the list). */
  status?: MessageStatus;
}

/** Per-chat look: Signal lets each conversation pick its own bubble colour / wallpaper. */
export interface ChatTheme {
  bubbleBackground: string;
  wallpaper?: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string;
  avatarUrl?: string;
  isPinned: boolean;
  unreadCount: number;
  lastMessage: LastMessagePreview;
  /** Seconds; undefined when disappearing messages are off. */
  disappearingSeconds?: number;
  theme?: ChatTheme;
  memberIds: string[];
}
