"use client";

import { useEffect, useRef } from "react";

import { useCurrentUser, useMessages } from "@/hooks/useMessages";
import { USERS } from "@/mocks/users";
import { toMessageRows } from "@/lib/chat/grouping";
import type { Conversation } from "@/types";

import { MessageBubble } from "./MessageBubble";
import { SystemMessage } from "./SystemMessage";

/** Scrollable message history, pinned to the newest message. */
export function MessageList({ conversation }: { conversation: Conversation }) {
  const messages = useMessages(conversation.id);
  const me = useCurrentUser();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isGroup = conversation.type === "group";

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversation.id, messages.length]);

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 scrollbar-thin overflow-y-auto pt-2 pb-3">
      {toMessageRows(messages).map(({ message, isRunStart, isRunEnd }) => {
        if (message.kind === "system")
          return <SystemMessage key={message.id} text={message.body} />;

        const outgoing = message.senderId === me.id;
        return (
          <MessageBubble
            key={message.id}
            message={message}
            sender={USERS[message.senderId]}
            outgoing={outgoing}
            isGroup={isGroup}
            showSenderName={isGroup && !outgoing && isRunStart}
            showAvatar={isRunEnd}
            isRunStart={isRunStart}
            showTimer={conversation.disappearingSeconds !== undefined}
          />
        );
      })}
    </div>
  );
}
