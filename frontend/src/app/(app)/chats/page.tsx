import { Icon } from "@/components/icons/Icon";

/** Desktop empty state when no conversation is selected. On mobile the list fills the screen. */
export default function ChatsIndexPage() {
  return (
    <div className="text-secondary hidden h-full flex-col items-center justify-center gap-3 md:flex">
      <Icon name="chat" size={48} />
      <p className="text-[0.9375rem]">Select a chat to start messaging</p>
    </div>
  );
}
