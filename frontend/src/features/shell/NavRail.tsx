"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon, type IconName } from "@/components/icons/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useConversations } from "@/hooks/useConversations";
import { useCurrentUser } from "@/hooks/useMessages";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  activeIcon?: IconName;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/chats", label: "Chats", icon: "chat", activeIcon: "chat-fill" },
  { href: "/calls", label: "Calls", icon: "phone", activeIcon: "phone-fill" },
  { href: "/stories", label: "Stories", icon: "stories", activeIcon: "stories-fill" },
];

/** Desktop-only left rail: section navigation, settings and the profile avatar. */
export function NavRail() {
  const pathname = usePathname();
  const { pinned, others } = useConversations();
  const unreadChats = [...pinned, ...others].filter((c) => c.unreadCount > 0).length;
  const me = useCurrentUser();

  return (
    <nav className="bg-rail border-divider hidden w-24 shrink-0 flex-col items-center border-r py-4 md:flex">
      <button
        aria-label="Menu"
        className="text-text hover:bg-hover mb-4 flex size-12 items-center justify-center rounded-xl"
      >
        <Icon name="menu" size={24} />
      </button>

      <div className="flex flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className={clsx(
                "text-text relative flex h-12 w-[4.5rem] items-center justify-center rounded-xl transition-colors",
                active ? "bg-selected" : "hover:bg-hover",
              )}
            >
              <Icon name={active && item.activeIcon ? item.activeIcon : item.icon} size={26} />
              {item.href === "/chats" && (
                <Badge count={unreadChats} tone="notification" className="absolute top-1 right-2" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col items-center gap-4">
        <Link
          href="/settings"
          aria-label="Settings"
          title="Settings"
          className={clsx(
            "text-text hover:bg-hover flex size-11 items-center justify-center rounded-xl",
            pathname.startsWith("/settings") && "bg-selected",
          )}
        >
          <Icon name="settings" size={26} />
        </Link>
        <Avatar name={me.displayName} src={me.avatarUrl} size={32} />
      </div>
    </nav>
  );
}
