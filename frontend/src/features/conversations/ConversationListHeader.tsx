"use client";

import { useRouter } from "next/navigation";

import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { Menu } from "@/components/ui/Menu";
import { useCurrentUser } from "@/hooks/useMessages";
import { useUiStore } from "@/stores/ui";

/** Desktop shows "Chats" left-aligned with compose/more; iPhone centres it between avatar and actions. */
export function ConversationListHeader() {
  const me = useCurrentUser();
  const router = useRouter();
  const openModal = useUiStore((state) => state.openModal);

  return (
    <header className="relative flex h-14 items-center justify-between px-4 md:h-[5.25rem] md:px-[1.8rem]">
      <button
        type="button"
        aria-label="Settings"
        onClick={() => router.push("/settings")}
        className="md:hidden"
      >
        <Avatar name={me.displayName} src={me.avatarUrl} size={34} />
      </button>

      <h1 className="text-text text-[1.0625rem] font-semibold max-md:absolute max-md:left-1/2 max-md:-translate-x-1/2 md:text-[1.3rem]">
        Chats
      </h1>

      {/* Desktop actions */}
      <div className="hidden items-center md:flex">
        <IconButton icon="compose" label="New chat" onClick={() => openModal("new-chat")} />
        <Menu
          icon="more"
          label="More"
          items={[
            { label: "New group", onSelect: () => openModal("new-group") },
            { label: "Add contact", onSelect: () => openModal("add-contact") },
            { label: "Settings", onSelect: () => router.push("/settings") },
          ]}
        />
      </div>

      {/* iPhone actions */}
      <div className="flex items-center gap-1 md:hidden">
        <IconButton icon="camera" label="Camera" />
        <IconButton icon="edit" label="New chat" onClick={() => openModal("new-chat")} />
      </div>
    </header>
  );
}
