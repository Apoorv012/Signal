import clsx from "clsx";

interface BadgeProps {
  count: number;
  /** unread = blue pill in a conversation row; notification = red badge on nav icons. */
  tone?: "unread" | "notification";
  className?: string;
}

export function Badge({ count, tone = "unread", className }: BadgeProps) {
  if (count <= 0) return null;
  return (
    <span
      className={clsx(
        "flex h-[1.375rem] min-w-[1.375rem] items-center justify-center rounded-full px-1.5 text-[0.8125rem] leading-none font-medium text-white",
        tone === "unread" ? "bg-unread" : "bg-badge h-[1.125rem] min-w-[1.125rem] text-[0.75rem]",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
