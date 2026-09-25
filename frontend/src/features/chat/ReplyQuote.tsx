import clsx from "clsx";

import type { QuotedMessage } from "@/types";

/** The quoted message shown at the top of a reply bubble; tapping it jumps to the original. */
export function ReplyQuote({
  quote,
  outgoing,
  onOpen,
}: {
  quote: QuotedMessage;
  outgoing: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={clsx(
        "mb-1.5 block w-full min-w-[9rem] rounded-lg border-l-4 px-2.5 py-1 text-left",
        outgoing ? "border-white/70 bg-black/20" : "border-unread bg-text/10",
      )}
    >
      <span className="block truncate text-[0.8125rem] font-semibold">{quote.senderName}</span>
      <span className="line-clamp-2 block text-[0.875rem] opacity-90">{quote.preview}</span>
    </button>
  );
}
