import clsx from "clsx";
import Link from "next/link";

import { Icon } from "@/components/icons/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { MessageStatusIcon } from "@/components/ui/MessageStatusIcon";
import { useCurrentUser } from "@/hooks/useSession";
import { useIsOnline, useTypingUsers } from "@/hooks/useTyping";
import { getPeer } from "@/lib/chat/conversation";
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

/** One row of the conversation list, with pinned / muted / unread / typing indicators. */
export function ConversationListItem({ conversation, selected }: ConversationListItemProps) {
  const me = useCurrentUser();
  const { lastMessage, unreadCount, isPinned, isMuted } = conversation;
  const peer = getPeer(conversation, me.id);
  const peerOnline = useIsOnline(peer);
  const typingUsers = useTypingUsers(conversation);

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
        online={peerOnline}
        size={56}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="text-text truncate text-[1.0625rem] font-semibold md:text-[1rem]">
              {conversation.title}
            </span>
            {isMuted && (
              <Icon name="bell-slash-fill" size={16} className="text-secondary" label="Muted" />
            )}
          </span>
          {lastMessage && (
            <time
              suppressHydrationWarning
              className="text-secondary shrink-0 text-[0.9375rem] md:text-[0.875rem]"
            >
              {formatTimestamp(lastMessage.createdAt)}
            </time>
          )}
        </div>

        <div className="flex items-start gap-2">
          <p
            className={clsx(
              "line-clamp-2 min-h-[1.35em] min-w-0 flex-1 text-[0.9375rem] leading-[1.35] md:text-[0.875rem]",
              typingUsers.length > 0 ? "text-unread font-medium" : "text-secondary",
            )}
          >
            {typingUsers.length > 0 ? (
              "typing…"
            ) : lastMessage ? (
              <>
                {lastMessage.senderName && `${lastMessage.senderName}: `}
                {PREVIEW_PREFIX[lastMessage.kind]}
                {lastMessage.text}
              </>
            ) : (
              "No messages yet"
            )}
          </p>
          <div className="text-secondary flex h-6 shrink-0 items-center gap-1.5">
            {isPinned && <Icon name="pin" size={16} label="Pinned" />}
            {unreadCount > 0 ? (
              <Badge count={unreadCount} muted={isMuted} />
            ) : (
              lastMessage?.status && <MessageStatusIcon status={lastMessage.status} />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
