"use client";

import type { CSSProperties } from "react";

import { useConversation } from "@/hooks/useConversations";

import { ChatHeader } from "./ChatHeader";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";

/** Full conversation pane. Per-chat colours are applied as CSS variables on the wrapper. */
export function ChatView({ conversationId }: { conversationId: string }) {
  const conversation = useConversation(conversationId);

  if (!conversation) {
    return (
      <div className="text-secondary flex flex-1 items-center justify-center">
        Conversation not found
      </div>
    );
  }

  const { theme } = conversation;
  const style = {
    "--bubble-out-bg": theme?.bubbleBackground,
    "--wallpaper": theme?.wallpaper,
  } as CSSProperties;

  return (
    <section
      style={style}
      data-wallpaper={theme?.wallpaper ? "true" : undefined}
      className="chat-pane flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
    >
      <ChatHeader conversation={conversation} />
      <MessageList conversation={conversation} />
      <Composer />
    </section>
  );
}
