import type { User } from "@/types";

/** Case-insensitive match on name, @username or phone (digits only, so "555 000" finds +1555000…). */
export function userMatches(user: User, query: string): boolean {
  const q = query.trim().toLowerCase().replace(/^@/, "");
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  return (
    user.displayName.toLowerCase().includes(q) ||
    (user.username?.toLowerCase().includes(q) ?? false) ||
    (digits.length > 0 && (user.phone?.replace(/\D/g, "").includes(digits) ?? false))
  );
}

export const filterUsers = (users: User[], query: string): User[] =>
  users.filter((user) => userMatches(user, query));
