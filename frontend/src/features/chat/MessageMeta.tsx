import clsx from "clsx";

import { Icon } from "@/components/icons/Icon";
import { MessageStatusIcon } from "@/components/ui/MessageStatusIcon";
import { formatTimestamp } from "@/lib/format/time";
import type { Message } from "@/types";

interface MessageMetaProps {
  message: Message;
  outgoing: boolean;
  /** Conversation has disappearing messages on: shows the timer glyph. */
  showTimer: boolean;
  className?: string;
}

/** "20m ⏲ ✓✓" cluster at the bottom-right of a bubble. */
export function MessageMeta({ message, outgoing, showTimer, className }: MessageMetaProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-[0.875rem] leading-none whitespace-nowrap md:text-[0.8125rem]",
        outgoing ? "text-on-bubble-out/80" : "text-secondary",
        className,
      )}
    >
      <time suppressHydrationWarning>{formatTimestamp(message.createdAt)}</time>
      {showTimer && <Icon name="timer-compact" size={16} />}
      {outgoing && <MessageStatusIcon status={message.status} />}
    </span>
  );
}
