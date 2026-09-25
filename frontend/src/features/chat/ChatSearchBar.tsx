"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/icons/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { useMessageSearch } from "@/hooks/useMessageSearch";
import { useUiStore } from "@/stores/ui";

/**
 * In-chat search under the header. Results are newest first; "up" goes to older matches.
 * The selected match is handed to the message list through the UI store (`requestJump`).
 */
export function ChatSearchBar({
  conversationId,
  onTermChange,
  onClose,
}: {
  conversationId: number;
  /** Reports the text to highlight in the message list. */
  onTermChange: (term: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const { term, results, isSearching } = useMessageSearch(query, conversationId);
  const requestJump = useUiStore((state) => state.requestJump);

  const position = Math.min(index, Math.max(results.length - 1, 0));
  const current = results[position];

  useEffect(() => onTermChange(term), [term, onTermChange]);

  useEffect(() => {
    if (current) requestJump({ conversationId, messageId: current.id, query: "" });
  }, [current, conversationId, requestJump]);

  const step = (delta: number) => {
    if (results.length === 0) return;
    setIndex((position + delta + results.length) % results.length);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") onClose();
    else if (event.key === "Enter") step(event.shiftKey ? -1 : 1);
  };

  const status = !term
    ? ""
    : results.length > 0
      ? `${position + 1} of ${results.length}`
      : isSearching
        ? ""
        : "No results";

  return (
    <div className="bg-chat border-divider flex items-center gap-2 border-b px-3 py-1.5 md:px-4">
      <label className="bg-field text-secondary flex h-9 min-w-0 flex-1 items-center gap-2 rounded-[0.625rem] px-3">
        <Icon name="search" size={20} />
        <input
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIndex(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search in chat"
          aria-label="Search in chat"
          className="text-text placeholder:text-secondary min-w-0 flex-1 bg-transparent text-[1rem] outline-none"
        />
      </label>

      <span className="text-secondary min-w-[4.5rem] text-right text-[0.875rem]" aria-live="polite">
        {status}
      </span>
      <IconButton
        icon="chevron-down"
        label="Older match"
        className="rotate-180"
        disabled={results.length === 0}
        onClick={() => step(1)}
      />
      <IconButton
        icon="chevron-down"
        label="Newer match"
        disabled={results.length === 0}
        onClick={() => step(-1)}
      />
      <IconButton icon="x" label="Close search" onClick={onClose} />
    </div>
  );
}
