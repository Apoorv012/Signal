const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

const clock = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

/** Signal-style timestamps: "Now", "20m", "9:30 AM", "Tue", "Sep 3". */
export function formatTimestamp(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const elapsed = now.getTime() - date.getTime();

  if (elapsed < MINUTE) return "Now";
  if (elapsed < 60 * MINUTE) return `${Math.floor(elapsed / MINUTE)}m`;
  if (date.toDateString() === now.toDateString()) return clock.format(date);
  if (elapsed < 6 * DAY) return weekday.format(date);
  return monthDay.format(date);
}

/** "1:32" style duration for voice notes. */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Compact label for headers: "1d", "5h", "30s". */
export function formatTimerShort(seconds: number): string {
  if (seconds >= 86_400) return `${Math.round(seconds / 86_400)}d`;
  if (seconds >= 3600) return `${Math.round(seconds / 3600)}h`;
  if (seconds >= 60) return `${Math.round(seconds / 60)}m`;
  return `${seconds}s`;
}

/** Human label for a disappearing-messages timer. */
export function formatTimerLabel(seconds: number): string {
  if (seconds >= DAY / 1000)
    return `${Math.round(seconds / (DAY / 1000))} day${seconds >= 2 * (DAY / 1000) ? "s" : ""}`;
  if (seconds >= 3600) return `${Math.round(seconds / 3600)} hour${seconds >= 7200 ? "s" : ""}`;
  if (seconds >= 60) return `${Math.round(seconds / 60)} minutes`;
  return `${seconds} seconds`;
}
