import { ChatView } from "@/features/chat/ChatView";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return <ChatView conversationId={Number(conversationId)} />;
}
