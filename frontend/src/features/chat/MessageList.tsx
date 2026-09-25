"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useMarkRead } from "@/hooks/useMarkRead";
import { useMessages } from "@/hooks/useMessages";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useCurrentUser } from "@/hooks/useSession";
import { useTypingUsers } from "@/hooks/useTyping";
import { findMember } from "@/lib/chat/conversation";
import { toMessageRows } from "@/lib/chat/grouping";
import { type JumpTarget, useUiStore } from "@/stores/ui";
import type { Conversation } from "@/types";

import { MessageBubble } from "./MessageBubble";
import { SystemMessage } from "./SystemMessage";
import { TypingIndicator } from "./TypingIndicator";

const NEAR_BOTTOM_PX = 120;
const NEAR_TOP_PX = 100;
const FLASH_MS = 1600;
const HIGHLIGHT_MS = 4000;

/** Scrollable message history: sticks to the newest message and loads older pages on scroll-up. */
export function MessageList({
  conversation,
  searchTerm,
}: {
  conversation: Conversation;
  /** Text the in-chat search bar wants highlighted. */
  searchTerm: string;
}) {
  const { messages, hasMore, isLoading, loadOlder, reveal } = useMessages(conversation.id);
  const { retry } = useSendMessage(conversation.id);
  const typingUsers = useTypingUsers(conversation);
  const me = useCurrentUser();
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const loadingOlder = useRef(false);
  const isGroup = conversation.type === "group";

  // A search result asked us to show a message: load history until it exists, scroll, flash.
  const jump = useUiStore((state) => state.jumpTarget);
  const clearJump = useUiStore((state) => state.clearJump);
  const target = jump?.conversationId === conversation.id ? jump : null;
  const handledJump = useRef<JumpTarget | null>(null);
  const [flashId, setFlashId] = useState<number | null>(null);
  // Highlight for a jump that came from the chat list search; it fades out by itself.
  const [listHighlight, setListHighlight] = useState("");

  useEffect(() => {
    if (!target || isLoading || handledJump.current === target) return;
    handledJump.current = target;
    clearJump(conversation.id); // consumed: a jump is handled exactly once
    if (target.query) setListHighlight(target.query);
    void reveal(target.messageId).then((found) => {
      if (!found) return;
      requestAnimationFrame(() => {
        const row = scrollRef.current?.querySelector(`[data-message-id="${target.messageId}"]`);
        row?.scrollIntoView({ block: "center" });
        setFlashId(target.messageId);
      });
    });
  }, [target, isLoading, reveal, clearJump, conversation.id]);

  useEffect(() => {
    if (!listHighlight) return;
    const timer = setTimeout(() => setListHighlight(""), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [listHighlight]);

  useEffect(() => {
    if (flashId === null) return;
    const timer = setTimeout(() => setFlashId(null), FLASH_MS);
    return () => clearTimeout(timer);
  }, [flashId]);

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
            highlight={searchTerm || listHighlight}
            flash={message.id === flashId}
            onRetry={retry}
          />
        );
      })}

      <TypingIndicator users={typingUsers} isGroup={isGroup} />
    </div>
  );
}
