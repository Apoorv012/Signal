"use client";

import Link from "next/link";

import { Icon } from "@/components/icons/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { useCurrentUser } from "@/hooks/useSession";
import { useIsOnline, useLastSeen, useTypingUsers } from "@/hooks/useTyping";
import { updateMySettings } from "@/lib/api/conversations";
import { getPeer } from "@/lib/chat/conversation";
import { formatLastSeen, formatTimerShort } from "@/lib/format/time";
import { upsertConversation } from "@/lib/query/cache";
import { useUiStore } from "@/stores/ui";
import type { Conversation } from "@/types";

import { useQueryClient } from "@tanstack/react-query";

/** One-line status under the title: typing, online / last seen (1:1) or member count (groups). */
function useSubtitle(conversation: Conversation): string | null {
  const me = useCurrentUser();
  const typing = useTypingUsers(conversation);
  const peer = getPeer(conversation, me.id);
  const online = useIsOnline(peer);
  const lastSeen = useLastSeen(peer);

  if (typing.length > 0) {
    return conversation.type === "group"
      ? `${typing[0].displayName.split(" ")[0]} is typing…`
      : "typing…";
  }
  if (conversation.type === "group") return `${conversation.members.length} members`;
  if (conversation.type === "direct") {
    if (online) return "Online";
    return lastSeen ? formatLastSeen(lastSeen) : null;
  }
  return null;
}

/** Top bar: back (mobile), avatar + title, call/search/more actions. */
export function ChatHeader({
  conversation,
  onSearch,
}: {
  conversation: Conversation;
  onSearch: () => void;
}) {
  const queryClient = useQueryClient();
  const openModal = useUiStore((state) => state.openModal);
  const pushToast = useUiStore((state) => state.pushToast);
  const me = useCurrentUser();
  const isGroup = conversation.type === "group";
  const timer = conversation.disappearingSeconds;
  const subtitle = useSubtitle(conversation);
  const peerOnline = useIsOnline(getPeer(conversation, me.id));

  const saveSetting = async (patch: { isPinned?: boolean; isMuted?: boolean }) => {
    try {
      upsertConversation(queryClient, await updateMySettings(conversation.id, patch));
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not update chat");
    }
  };

  const menuItems: MenuItem[] = [
    ...(isGroup
      ? [{ label: "Group info", onSelect: () => openModal("group-info", conversation.id) }]
      : []),
    ...(conversation.type === "direct"
      ? [{ label: "Safety number", onSelect: () => openModal("safety-number", conversation.id) }]
      : []),
    // The header icon is desktop-only; on the phone search lives in this menu.
    { label: "Search", onSelect: onSearch },
    {
      label: conversation.isPinned ? "Unpin chat" : "Pin chat",
      onSelect: () => void saveSetting({ isPinned: !conversation.isPinned }),
    },
    {
      label: conversation.isMuted ? "Unmute notifications" : "Mute notifications",
      onSelect: () => void saveSetting({ isMuted: !conversation.isMuted }),
    },
  ];

  const titleBlock = (
    <>
      <Avatar
        name={conversation.title}
        src={conversation.avatarUrl}
        variant={conversation.type}
        online={peerOnline}
        size={44}
      />
      <div className="ml-2 min-w-0 flex-1 text-left">
        <div className="flex items-center gap-1.5">
          <h1 className="text-text truncate text-[1.125rem] leading-tight font-semibold">
            {conversation.title}
          </h1>
          {conversation.isMuted && (
            <Icon name="bell-slash-fill" size={16} className="text-secondary" label="Muted" />
          )}
          {conversation.isPinned && (
            <Icon name="pin" size={16} className="text-secondary" label="Pinned" />
          )}
        </div>
        {(subtitle || timer !== null) && (
          <p className="text-secondary flex items-center gap-1 truncate text-[0.875rem]">
            {timer !== null && (
              <>
                <Icon name="timer-compact" size={16} />
                <span>{formatTimerShort(timer)}</span>
                {subtitle && <span>·</span>}
              </>
            )}
            {subtitle}
          </p>
        )}
      </div>
    </>
  );

  return (
    <header className="bg-chat/85 flex h-16 shrink-0 items-center gap-1 px-2 backdrop-blur md:h-[5.25rem] md:px-5">
      <Link
        href="/chats"
        aria-label="Back"
        className="text-text flex size-10 items-center justify-center md:hidden"
      >
        <Icon name="chevron-left" size={28} />
      </Link>

      {isGroup ? (
        <button
          type="button"
          onClick={() => openModal("group-info", conversation.id)}
          className="flex min-w-0 flex-1 items-center"
        >
          {titleBlock}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center">{titleBlock}</div>
      )}

      <div className="flex items-center">
        <IconButton
          icon="video"
          label="Video call"
          onClick={() => pushToast("Video calls are coming soon")}
        />
        {!isGroup && (
          <IconButton
            icon="phone"
            label="Voice call"
            onClick={() => pushToast("Voice calls are coming soon")}
          />
        )}
        <IconButton icon="search" label="Search" className="max-md:hidden" onClick={onSearch} />
        <Menu icon="more" label="More" items={menuItems} />
      </div>
    </header>
  );
}
