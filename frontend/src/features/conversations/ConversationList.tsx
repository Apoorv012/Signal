"use client";

import clsx from "clsx";
import { useParams } from "next/navigation";

import { SearchInput } from "@/components/ui/SearchInput";
import { useConversations } from "@/hooks/useConversations";
import type { Conversation } from "@/types";

import { ConversationListHeader } from "./ConversationListHeader";
import { ConversationListItem } from "./ConversationListItem";

function SectionLabel({ children }: { children: React.ReactNode }) {
  // Section labels only exist on the iPhone layout.
  return (
    <h2 className="text-text px-4 pt-4 pb-1 text-[17px] font-semibold md:hidden">{children}</h2>
  );
}

/**
 * Left column. On mobile it is a full screen that gives way to the chat route;
 * on desktop it is a fixed-width column next to the chat pane.
 */
export function ConversationList() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { pinned, others } = useConversations();

  const renderItems = (items: Conversation[]) =>
    items.map((c) => (
      <ConversationListItem key={c.id} conversation={c} selected={c.id === conversationId} />
    ));

  return (
    <aside
      className={clsx(
        "bg-chat md:bg-list md:border-divider min-h-0 w-full shrink-0 flex-col md:flex md:w-80 md:border-r lg:w-[340px]",
        conversationId ? "hidden" : "flex",
      )}
    >
      <ConversationListHeader />
      <div className="px-4 pb-2 md:px-4">
        <SearchInput />
      </div>

      <div className="min-h-0 flex-1 scrollbar-thin overflow-y-auto pb-2">
        {pinned.length > 0 && (
          <>
            <SectionLabel>Pinned</SectionLabel>
            {renderItems(pinned)}
            <SectionLabel>Chats</SectionLabel>
          </>
        )}
        {renderItems(others)}
      </div>
    </aside>
  );
}
