import { USERS } from "@/mocks/users";
import type { User } from "@/types";

/** Contacts of the current user (everyone but me), alphabetical. Phase 3: GET /contacts. */
export function useContacts(): User[] {
  return Object.values(USERS)
    .filter((user) => user.id !== "me")
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}
