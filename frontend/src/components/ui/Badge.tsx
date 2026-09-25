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
        "flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[13px] leading-none font-medium text-white",
        tone === "unread" ? "bg-unread" : "bg-badge h-[18px] min-w-[18px] text-[12px]",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
