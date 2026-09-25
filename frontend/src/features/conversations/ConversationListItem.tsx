import clsx from "clsx";
import Link from "next/link";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { MessageStatusIcon } from "@/components/ui/MessageStatusIcon";
import { formatTimestamp } from "@/lib/format/time";
import type { Conversation, MessageKind } from "@/types";

const PREVIEW_PREFIX: Partial<Record<MessageKind, string>> = {
  voice: "🎤 ",
  file: "📎 ",
  image: "📷 ",
};

interface ConversationListItemProps {
  conversation: Conversation;
  selected: boolean;
}

export function ConversationListItem({ conversation, selected }: ConversationListItemProps) {
  const { lastMessage, unreadCount } = conversation;
  const isUnread = unreadCount > 0;
  // Media messages show a label ("Voice Message", "File"); text shows the body.
  const prefix = PREVIEW_PREFIX[lastMessage.kind] ?? "";

  return (
    <Link
      href={`/chats/${conversation.id}`}
      className={clsx(
        "flex items-start gap-3 rounded-xl px-3 py-3 transition-colors md:mx-[0.75rem] md:px-[1.05rem]",
        selected ? "md:bg-selected" : "hover:bg-hover",
      )}
    >
      <Avatar
        name={conversation.title}
        src={conversation.avatarUrl}
        variant={conversation.type}
        size={56}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-text truncate text-[1.0625rem] font-semibold md:text-[1rem]">
            {conversation.title}
          </span>
          <time
            suppressHydrationWarning
            className="text-secondary shrink-0 text-[0.9375rem] md:text-[0.875rem]"
          >
            {formatTimestamp(lastMessage.createdAt)}
          </time>
        </div>

        <div className="flex items-start gap-2">
          <p
            className={clsx(
              "text-secondary line-clamp-2 min-w-0 flex-1 text-[0.9375rem] leading-[1.35] md:text-[0.875rem]",
            )}
          >
            {lastMessage.senderName && `${lastMessage.senderName}: `}
            {prefix}
            {lastMessage.text}
          </p>
          <div className="text-secondary flex h-6 shrink-0 items-center">
            {isUnread ? (
              <Badge count={unreadCount} />
            ) : (
              lastMessage.status && <MessageStatusIcon status={lastMessage.status} />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
