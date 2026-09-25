import Link from "next/link";

import { Icon } from "@/components/icons/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { formatTimerLabel } from "@/lib/format/time";
import type { Conversation } from "@/types";

/** Top bar: back (mobile), avatar + title, call/search/more actions. */
export function ChatHeader({ conversation }: { conversation: Conversation }) {
  const isGroup = conversation.type === "group";
  const timer = conversation.disappearingSeconds;

  return (
    <header className="bg-chat/85 flex h-16 shrink-0 items-center gap-1 px-2 backdrop-blur md:h-[72px] md:px-5">
      <Link
        href="/chats"
        aria-label="Back"
        className="text-text flex size-10 items-center justify-center md:hidden"
      >
        <Icon name="chevron-left" size={28} />
      </Link>

      <Avatar
        name={conversation.title}
        src={conversation.avatarUrl}
        variant={conversation.type}
        size={44}
        className="md:!size-11"
      />
      <div className="ml-2 min-w-0 flex-1">
        <h1 className="text-text truncate text-[18px] leading-tight font-semibold">
          {conversation.title}
        </h1>
        {timer !== undefined && (
          <p className="text-secondary flex items-center gap-1 text-[14px] md:hidden">
            <Icon name="timer-compact" size={16} />
            {formatTimerLabel(timer)}
          </p>
        )}
      </div>

      <div className="flex items-center">
        <IconButton icon="video" label="Video call" />
        {!isGroup && <IconButton icon="phone" label="Voice call" />}
        <IconButton icon="search" label="Search" className="max-md:hidden" />
        <IconButton icon="more" label="More" className="max-md:hidden" />
      </div>
    </header>
  );
}
