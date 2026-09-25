export const queryKeys = {
  conversations: ["conversations"] as const,
  messages: (conversationId: number) => ["messages", conversationId] as const,
  contacts: ["contacts"] as const,
  devices: ["devices"] as const,
};

/** Cached shape of a conversation's message history (oldest first). */
export interface MessagesPage {
  items: import("@/types").Message[];
  hasMore: boolean;
}
