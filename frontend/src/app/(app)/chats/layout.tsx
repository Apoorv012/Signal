import { ConversationList } from "@/features/conversations/ConversationList";

/** Chats section: conversation list + the selected conversation (route child). */
export default function ChatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ConversationList />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </>
  );
}
