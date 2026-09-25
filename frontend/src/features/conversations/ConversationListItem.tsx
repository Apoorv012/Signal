import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";

import { Icon } from "@/components/icons/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ContextMenuItem } from "@/components/ui/ContextMenu";
import { type SwipeAction, SwipeableRow } from "./SwipeableRow";
import { MessageStatusIcon } from "@/components/ui/MessageStatusIcon";
import { useContextMenu } from "@/hooks/useContextMenu";
import { useConversationActions } from "@/hooks/useConversationActions";
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
  const { lastMessage, unreadCount, isPinned, isMuted, markedUnread } = conversation;
  const isGroup = conversation.type === "group";
  const actions = useConversationActions(conversation);
  const { menuProps, menu } = useContextMenu();
  const [confirm, setConfirm] = useState<"clear" | "delete" | null>(null);
  const peer = getPeer(conversation, me.id);
  const peerOnline = useIsOnline(peer);
  const typingUsers = useTypingUsers(conversation);

  const menuItems: ContextMenuItem[] = [
    { label: isPinned ? "Unpin chat" : "Pin chat", onSelect: actions.togglePin },
    {
      label: isMuted ? "Unmute notifications" : "Mute notifications",
      onSelect: actions.toggleMute,
    },
    // A chat with real unread messages is "read" by opening it; only offer the manual flag otherwise.
    ...(unreadCount === 0
      ? [
          {
            label: markedUnread ? "Mark as read" : "Mark as unread",
            onSelect: () => void actions.setMarkedUnread(!markedUnread),
          },
        ]
      : []),
    { label: "Clear messages", separatorBefore: true, onSelect: () => setConfirm("clear") },
    {
      label: isGroup ? "Leave and delete" : "Delete chat",
      danger: true,
      onSelect: () => setConfirm("delete"),
    },
  ];

  // iPhone swipe: right reveals Pin / Unread, left reveals Mute / Delete.
  const startActions: SwipeAction[] = [
    {
      label: isPinned ? "Unpin" : "Pin",
      icon: "pin",
      className: "bg-unread",
      onSelect: actions.togglePin,
    },
    ...(unreadCount === 0
      ? [
          {
            label: markedUnread ? "Read" : "Unread",
            icon: "chat" as const,
            className: "bg-secondary",
            onSelect: () => void actions.setMarkedUnread(!markedUnread),
          },
        ]
      : []),
  ];
  const endActions: SwipeAction[] = [
    {
      label: isMuted ? "Unmute" : "Mute",
      icon: "bell-slash-fill",
      className: "bg-secondary",
      onSelect: actions.toggleMute,
    },
    {
      label: "Delete",
      icon: "trash",
      className: "bg-danger",
      onSelect: () => setConfirm("delete"),
    },
  ];

  return (
    <>
      <SwipeableRow startActions={startActions} endActions={endActions}>
        <Link
          href={`/chats/${conversation.id}`}
          {...menuProps(menuItems)}
          className={clsx(
            "touch-menu-target flex items-start gap-3 rounded-xl px-3 py-3 transition-colors md:mx-[0.75rem] md:px-[1.05rem]",
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
                ) : markedUnread ? (
                  <span
                    role="img"
                    aria-label="Marked unread"
                    className={clsx(
                      "size-3.5 rounded-full",
                      isMuted ? "bg-secondary/70" : "bg-unread",
                    )}
                  />
                ) : (
                  lastMessage?.status && <MessageStatusIcon status={lastMessage.status} />
                )}
              </div>
            </div>
          </div>
        </Link>
      </SwipeableRow>
      {menu}
      {confirm === "clear" && (
        <ConfirmDialog
          title="Clear messages?"
          message="All messages in this chat are removed for you. Other people keep their copy."
          confirmLabel="Clear"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            void actions.clear();
          }}
        />
      )}
      {confirm === "delete" && (
        <ConfirmDialog
          title={isGroup ? "Leave and delete?" : "Delete this chat?"}
          message={
            isGroup
              ? "You will leave this group and its messages are removed for you."
              : "Messages are removed for you. The chat comes back if a new message arrives."
          }
          confirmLabel={isGroup ? "Leave" : "Delete"}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            void actions.deleteChat();
          }}
        />
      )}
    </>
  );
}
