"use client";

import Link from "next/link";

import { Avatar } from "@/components/ui/Avatar";
import { HighlightedText } from "@/components/ui/HighlightedText";
import { formatTimestamp } from "@/lib/format/time";
import { useUiStore } from "@/stores/ui";
import type { Conversation, Message } from "@/types";

interface MessageSearchResultProps {
  message: Message;
  conversation: Conversation;
  query: string;
}

/** A message hit in the list search: opens its chat and jumps to the message. */
export function MessageSearchResult({ message, conversation, query }: MessageSearchResultProps) {
  const requestJump = useUiStore((state) => state.requestJump);

  return (
    <Link
      href={`/chats/${conversation.id}`}
      onClick={() => requestJump({ conversationId: conversation.id, messageId: message.id, query })}
      className="hover:bg-hover flex items-start gap-3 rounded-xl px-3 py-3 transition-colors md:mx-[0.75rem] md:px-[1.05rem]"
    >
      <Avatar
        name={conversation.title}
        src={conversation.avatarUrl}
        variant={conversation.type}
        size={44}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-text truncate text-[1.0625rem] font-semibold md:text-[1rem]">
            {conversation.title}
          </span>
          <time
            suppressHydrationWarning
            className="text-secondary shrink-0 text-[0.9375rem] md:text-[0.875rem]"
          >
            {formatTimestamp(message.createdAt)}
          </time>
        </div>
        <p className="text-secondary line-clamp-2 text-[0.9375rem] leading-[1.35] md:text-[0.875rem]">
          <HighlightedText text={message.body} query={query} />
        </p>
      </div>
    </Link>
  );
}
