"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

import { useMarkRead } from "@/hooks/useMarkRead";
import { useMessages } from "@/hooks/useMessages";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useCurrentUser } from "@/hooks/useSession";
import { useTypingUsers } from "@/hooks/useTyping";
import { findMember } from "@/lib/chat/conversation";
import { toMessageRows } from "@/lib/chat/grouping";
import type { Conversation } from "@/types";

import { MessageBubble } from "./MessageBubble";
import { SystemMessage } from "./SystemMessage";
import { TypingIndicator } from "./TypingIndicator";

const NEAR_BOTTOM_PX = 120;
const NEAR_TOP_PX = 100;

/** Scrollable message history: sticks to the newest message and loads older pages on scroll-up. */
export function MessageList({ conversation }: { conversation: Conversation }) {
  const { messages, hasMore, isLoading, loadOlder } = useMessages(conversation.id);
  const { retry } = useSendMessage(conversation.id);
  const typingUsers = useTypingUsers(conversation);
  const me = useCurrentUser();
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const loadingOlder = useRef(false);
  const isGroup = conversation.type === "group";

  useMarkRead(conversation.id, messages);

  // New conversation: start at the bottom.
  useEffect(() => {
    stickToBottom.current = true;
  }, [conversation.id]);

  const newest = messages[messages.length - 1];
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Always follow my own messages; follow others only when I was already at the bottom.
    if (stickToBottom.current || newest?.senderId === me.id) el.scrollTop = el.scrollHeight;
  }, [newest?.id, newest?.senderId, me.id, typingUsers.length, isLoading, conversation.id]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;

    if (el.scrollTop < NEAR_TOP_PX && hasMore && !loadingOlder.current) {
      loadingOlder.current = true;
      const heightBefore = el.scrollHeight;
      void loadOlder().finally(() => {
        // Keep the message you were reading in place after older ones are prepended.
        requestAnimationFrame(() => {
          el.scrollTop += el.scrollHeight - heightBefore;
          loadingOlder.current = false;
        });
      });
    }
  };

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="min-h-0 flex-1 scrollbar-thin overflow-y-auto pt-2 pb-3"
    >
      {!isLoading && messages.length === 0 && (
        <p className="text-secondary px-8 pt-16 text-center text-[0.9375rem]">
          No messages yet. Say hello 👋
        </p>
      )}

      {toMessageRows(messages).map(({ message, isRunStart, isRunEnd }) => {
        const key = message.clientId ?? message.id;
        if (message.kind === "system") return <SystemMessage key={key} text={message.body} />;

        const outgoing = message.senderId === me.id;
        return (
          <MessageBubble
            key={key}
            message={message}
            sender={findMember(conversation, message.senderId)}
            outgoing={outgoing}
            isGroup={isGroup}
            showSenderName={isGroup && !outgoing && isRunStart}
            showAvatar={isRunEnd}
            isRunStart={isRunStart}
            showTimer={conversation.disappearingSeconds !== null}
            onRetry={retry}
          />
        );
      })}

      <TypingIndicator users={typingUsers} isGroup={isGroup} />
    </div>
  );
}
