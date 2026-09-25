import clsx from "clsx";

export const QUICK_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

/** Row of quick emoji at the top of the message menu. Picking your current one removes it. */
export function ReactionBar({
  current,
  onPick,
}: {
  current?: string;
  onPick: (emoji: string) => void;
}) {
  return (
    <div
      className="border-divider flex justify-between gap-1 border-b px-3 pb-2"
      role="group"
      aria-label="React"
    >
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          aria-label={`React ${emoji}`}
          aria-pressed={current === emoji}
          onClick={() => onPick(emoji)}
          className={clsx(
            "hover:bg-hover flex size-10 items-center justify-center rounded-full text-[1.5rem] transition-transform hover:scale-110",
            current === emoji && "bg-unread/20",
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
