import clsx from "clsx";

import type { Reaction } from "@/types";

/** Emoji reactions overlapping the bottom edge of a bubble. Tap one to add or remove yours. */
export function ReactionPills({
  reactions,
  outgoing,
  onToggle,
}: {
  reactions: Reaction[];
  outgoing: boolean;
  onToggle?: (emoji: string) => void;
}) {
  if (reactions.length === 0) return null;
  return (
    <div className={clsx("-mt-2 flex gap-1 px-2", outgoing && "justify-end")}>
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          onClick={() => onToggle?.(reaction.emoji)}
          aria-pressed={reaction.reactedByMe}
          aria-label={`${reaction.emoji} ${reaction.count}`}
          className={clsx(
            "bg-reaction z-10 flex h-7 items-center gap-1 rounded-full border-2 px-2 text-[0.875rem]",
            reaction.reactedByMe ? "border-unread" : "border-chat",
          )}
        >
          <span>{reaction.emoji}</span>
          {reaction.count > 1 && (
            <span className="text-text text-[0.8125rem] font-medium">{reaction.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
