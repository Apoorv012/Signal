import { MESSAGES } from "@/mocks/messages";
import { USERS } from "@/mocks/users";
import type { Message, User } from "@/types";

/** Messages of one conversation, oldest first. */
export function useMessages(conversationId: string): Message[] {
  return MESSAGES[conversationId] ?? [];
}

export function useUser(id: string): User | undefined {
  return USERS[id];
}

export function useCurrentUser(): User {
  return USERS.me;
}
