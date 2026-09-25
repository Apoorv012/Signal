import clsx from "clsx";

import type { Reaction } from "@/types";

/** Emoji reactions overlapping the bottom edge of a bubble (count shown when > 1). */
export function ReactionPills({
  reactions,
  outgoing,
}: {
  reactions: Reaction[];
  outgoing: boolean;
}) {
  if (reactions.length === 0) return null;
  return (
    <div className={clsx("-mt-2 flex gap-1 px-2", outgoing && "justify-end")}>
      {reactions.map((reaction) => (
        <span
          key={reaction.emoji}
          className="border-chat bg-reaction z-10 flex h-7 items-center gap-1 rounded-full border-2 px-2 text-[14px]"
        >
          <span>{reaction.emoji}</span>
          {reaction.count > 1 && (
            <span className="text-text text-[13px] font-medium">{reaction.count}</span>
          )}
        </span>
      ))}
    </div>
  );
}
