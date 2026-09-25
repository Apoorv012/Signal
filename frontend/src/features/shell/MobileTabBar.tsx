"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/icons/Icon";
import { Badge } from "@/components/ui/Badge";
import { useTotalUnread } from "@/hooks/useConversations";

/** iPhone-style bottom tabs (Chats / Stories). Hidden on desktop and inside a conversation. */
export function MobileTabBar() {
  const pathname = usePathname();
  const unreadChats = useTotalUnread();

  const insideConversation = /^\/chats\/[^/]+/.test(pathname);
  if (insideConversation) return null;

  const tabs = [
    { href: "/chats", label: "Chats", icon: "chat-fill" as const, badge: unreadChats },
    { href: "/stories", label: "Stories", icon: "stories-fill" as const, badge: 0 },
  ];

  return (
    <nav className="border-divider bg-rail/95 flex shrink-0 justify-around border-t pt-2 pb-[max(env(safe-area-inset-bottom),8px)] backdrop-blur md:hidden">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "relative flex w-24 flex-col items-center gap-0.5",
              active ? "text-text" : "text-secondary",
            )}
          >
            <Icon name={tab.icon} size={28} />
            <Badge count={tab.badge} tone="notification" className="absolute -top-1 right-5" />
            <span className="text-[0.75rem] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
