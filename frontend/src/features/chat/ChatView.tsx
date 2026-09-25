"use client";

import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useState } from "react";

import { useConversation } from "@/hooks/useConversations";
import { useUiStore } from "@/stores/ui";

import { ChatHeader } from "./ChatHeader";
import { ChatSearchBar } from "./ChatSearchBar";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";

/** Full conversation pane. Per-chat colours are applied as CSS variables on the wrapper. */
export function ChatView({ conversationId }: { conversationId: number }) {
  const router = useRouter();
  const { conversation, isLoading } = useConversation(conversationId);
  const setActiveConversation = useUiStore((state) => state.setActiveConversation);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Incoming messages in the open chat are read immediately (no unread badge, no toast).
  useEffect(() => {
    setActiveConversation(conversationId);
    return () => setActiveConversation(null);
  }, [conversationId, setActiveConversation]);

  // The search bar belongs to one chat: close it when switching.
  useEffect(() => setSearchOpen(false), [conversationId]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchTerm("");
  };

  // The conversation vanished (unknown id, or I was removed from the group).
  useEffect(() => {
    if (!isLoading && !conversation) router.replace("/chats");
  }, [isLoading, conversation, router]);

  if (!conversation) return <div className="bg-chat h-full flex-1" />;

  const { theme } = conversation;
  const style = {
    "--bubble-out-bg": theme?.bubbleBackground,
    "--wallpaper": theme?.wallpaper ?? undefined,
  } as CSSProperties;

  return (
    <section
      style={style}
      data-wallpaper={theme?.wallpaper ? "true" : undefined}
      className="chat-pane flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
    >
      <ChatHeader conversation={conversation} onSearch={() => setSearchOpen(true)} />
      {searchOpen && (
        <ChatSearchBar
          conversationId={conversation.id}
          onTermChange={setSearchTerm}
          onClose={closeSearch}
        />
      )}
      <MessageList conversation={conversation} searchTerm={searchOpen ? searchTerm : ""} />
      <Composer conversationId={conversation.id} />
    </section>
  );
}
