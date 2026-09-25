import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { useCurrentUser } from "@/hooks/useMessages";

/** Desktop shows "Chats" left-aligned with compose/more; iPhone centres it between avatar and actions. */
export function ConversationListHeader() {
  const me = useCurrentUser();

  return (
    <header className="relative flex h-14 items-center justify-between px-4 md:h-[72px] md:px-5">
      <Avatar name={me.displayName} src={me.avatarUrl} size={34} className="md:hidden" />

      <h1 className="text-text text-[17px] font-semibold max-md:absolute max-md:left-1/2 max-md:-translate-x-1/2 md:text-[24px]">
        Chats
      </h1>

      {/* Desktop actions */}
      <div className="hidden items-center md:flex">
        <IconButton icon="compose" label="New chat" />
        <IconButton icon="more" label="More" />
      </div>

      {/* iPhone actions */}
      <div className="flex items-center gap-1 md:hidden">
        <IconButton icon="camera" label="Camera" />
        <IconButton icon="edit" label="New chat" />
      </div>
    </header>
  );
}
