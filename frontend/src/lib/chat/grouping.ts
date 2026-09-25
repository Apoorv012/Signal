import type { Message } from "@/types";

const GROUP_WINDOW_MS = 3 * 60_000;

export interface MessageRow {
  message: Message;
  /** First message of a run by the same sender: shows the sender name in groups. */
  isRunStart: boolean;
  /** Last message of a run: shows the sender avatar in groups. */
  isRunEnd: boolean;
}

function continuesRun(previous: Message | undefined, current: Message | undefined): boolean {
  if (!previous || !current || previous.kind === "system" || current.kind === "system")
    return false;
  return (
    previous.senderId === current.senderId &&
    Date.parse(current.createdAt) - Date.parse(previous.createdAt) < GROUP_WINDOW_MS
  );
}

/** Annotates each message with its position in a run of consecutive messages by one sender. */
export function toMessageRows(messages: Message[]): MessageRow[] {
  return messages.map((message, index) => ({
    message,
    isRunStart: !continuesRun(messages[index - 1], message),
    isRunEnd: !continuesRun(message, messages[index + 1]),
  }));
}
