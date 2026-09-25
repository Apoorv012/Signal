/**
 * Unique id for a message being sent (the server uses it to de-duplicate retries).
 * crypto.randomUUID needs a secure context, which http://<lan-ip> on a phone is not.
 */
export function newClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
