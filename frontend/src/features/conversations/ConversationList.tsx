"use client";

import clsx from "clsx";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { SearchInput } from "@/components/ui/SearchInput";
import { useConversations } from "@/hooks/useConversations";
import type { Conversation } from "@/types";

import { ConversationListHeader } from "./ConversationListHeader";
import { ConversationListItem } from "./ConversationListItem";

function SectionLabel({ children }: { children: React.ReactNode }) {
  // Section labels only exist on the iPhone layout.
  return (
    <h2 className="text-text px-4 pt-4 pb-1 text-[1.0625rem] font-semibold md:hidden">
      {children}
    </h2>
  );
}

function matches(conversation: Conversation, query: string): boolean {
  const q = query.toLowerCase();
  return (
    conversation.title.toLowerCase().includes(q) ||
    conversation.lastMessage?.text.toLowerCase().includes(q) === true ||
    conversation.members.some((m) => m.user.phone.includes(q))
  );
}

/**
 * Left column. On mobile it is a full screen that gives way to the chat route;
 * on desktop it is a fixed-width column next to the chat pane.
 */
export function ConversationList() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const selectedId = conversationId ? Number(conversationId) : undefined;
  const { all, pinned, others, isLoading } = useConversations();
  const [query, setQuery] = useState("");

  const searching = query.trim().length > 0;
  const results = useMemo(
    () => (searching ? all.filter((c) => matches(c, query.trim())) : []),
    [all, query, searching],
  );

  const renderItems = (items: Conversation[]) =>
    items.map((c) => (
      <ConversationListItem key={c.id} conversation={c} selected={c.id === selectedId} />
    ));

  return (
    <aside
      className={clsx(
        "bg-chat md:bg-list md:border-divider min-h-0 w-full shrink-0 flex-col md:flex md:w-[24rem] md:border-r",
        conversationId ? "hidden" : "flex",
      )}
    >
      <ConversationListHeader />
      <div className="px-4 pb-2 md:px-4">
        <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="min-h-0 flex-1 scrollbar-thin overflow-y-auto pb-2">
        {isLoading && (
          <p className="text-secondary px-6 py-8 text-center text-[0.9375rem]">Loading…</p>
        )}

        {searching ? (
          <>
            {renderItems(results)}
            {results.length === 0 && (
              <p className="text-secondary px-6 py-8 text-center text-[0.9375rem]">
                No chats match &ldquo;{query.trim()}&rdquo;
              </p>
            )}
          </>
        ) : (
          <>
            {pinned.length > 0 && (
              <>
                <SectionLabel>Pinned</SectionLabel>
                {renderItems(pinned)}
                <SectionLabel>Chats</SectionLabel>
              </>
            )}
            {renderItems(others)}
          </>
        )}
      </div>
    </aside>
  );
}
