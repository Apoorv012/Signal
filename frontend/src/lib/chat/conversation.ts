import type { Conversation, User } from "@/types";

/** The other person in a one-to-one chat (undefined for groups and Note to Self). */
export function getPeer(conversation: Conversation, meId: number): User | undefined {
  if (conversation.type !== "direct") return undefined;
  return conversation.members.find((m) => m.user.id !== meId)?.user;
}

export function findMember(conversation: Conversation, userId: number | null): User | undefined {
  return conversation.members.find((m) => m.user.id === userId)?.user;
}
