"use client";

import clsx from "clsx";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { SearchInput } from "@/components/ui/SearchInput";
import { useConversations } from "@/hooks/useConversations";
import { useMessageSearch } from "@/hooks/useMessageSearch";
import type { Conversation } from "@/types";

import { ConversationListHeader } from "./ConversationListHeader";
import { ConversationListItem } from "./ConversationListItem";
import { MessageSearchResult } from "./MessageSearchResult";

function SectionLabel({
  children,
  always,
}: {
  children: React.ReactNode;
  /** Search headings show on desktop too; the Pinned/Chats labels are iPhone-only. */
  always?: boolean;
}) {
  return (
    <h2
      className={clsx(
        "text-text px-4 pt-4 pb-1 text-[1.0625rem] font-semibold",
        always ? "md:text-secondary md:px-[1.85rem] md:text-[0.875rem]" : "md:hidden",
      )}
    >
      {children}
    </h2>
  );
}

type ListFilter = "all" | "unread" | "groups";

const FILTERS: { id: ListFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "groups", label: "Groups" },
];

const passesFilter = (conversation: Conversation, filter: ListFilter): boolean =>
  filter === "all" ||
  (filter === "unread"
    ? conversation.unreadCount > 0 || conversation.markedUnread
    : conversation.type === "group");

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
  const { all, visible, pinned, others, isLoading } = useConversations();
  const [filter, setFilter] = useState<ListFilter>("all");
  const [query, setQuery] = useState("");

  const searching = query.trim().length > 0;
  const results = useMemo(
    () => (searching ? visible.filter((c) => matches(c, query.trim())) : []),
    [visible, query, searching],
  );

  const messageSearch = useMessageSearch(query);
  const chatsById = useMemo(() => new Map(all.map((c) => [c.id, c])), [all]);
  const messageHits = messageSearch.results.flatMap((message) => {
    const conversation = chatsById.get(message.conversationId);
    return conversation ? [{ message, conversation }] : [];
  });
  const showHeadings = results.length > 0 && messageHits.length > 0;

  const shownPinned = pinned.filter((c) => passesFilter(c, filter));
  const shownOthers = others.filter((c) => passesFilter(c, filter));

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
      {!searching && (
        <div className="flex gap-2 px-4 pb-2" role="group" aria-label="Filter chats">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className={clsx(
                "rounded-full px-3.5 py-1 text-[0.875rem] font-medium transition-colors",
                filter === id ? "bg-unread text-white" : "bg-field text-text hover:brightness-95",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 scrollbar-thin overflow-y-auto pb-2">
        {isLoading && (
          <p className="text-secondary px-6 py-8 text-center text-[0.9375rem]">Loading…</p>
        )}

        {searching ? (
          <>
            {showHeadings && <SectionLabel always>Chats</SectionLabel>}
            {renderItems(results)}
            {showHeadings && <SectionLabel always>Messages</SectionLabel>}
            {messageHits.map(({ message, conversation }) => (
              <MessageSearchResult
                key={message.id}
                message={message}
                conversation={conversation}
                query={messageSearch.term}
              />
            ))}
            {results.length === 0 && messageHits.length === 0 && !messageSearch.isSearching && (
              <p className="text-secondary px-6 py-8 text-center text-[0.9375rem]">
                No chats or messages match &ldquo;{query.trim()}&rdquo;
              </p>
            )}
          </>
        ) : (
          <>
            {shownPinned.length > 0 && (
              <>
                <SectionLabel>Pinned</SectionLabel>
                {renderItems(shownPinned)}
                <SectionLabel>Chats</SectionLabel>
              </>
            )}
            {renderItems(shownOthers)}
            {!isLoading && filter !== "all" && shownPinned.length + shownOthers.length === 0 && (
              <p className="text-secondary px-6 py-8 text-center text-[0.9375rem]">
                {filter === "unread" ? "No unread chats" : "No groups yet"}
              </p>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
