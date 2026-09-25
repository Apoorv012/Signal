"use client";

import { AddContactModal } from "@/features/conversations/AddContactModal";
import { NewChatModal } from "@/features/conversations/NewChatModal";
import { SafetyNumberModal } from "@/features/chat/SafetyNumberModal";
import { ForwardModal } from "@/features/chat/ForwardModal";
import { GroupInfoModal } from "@/features/groups/GroupInfoModal";
import { NewGroupModal } from "@/features/groups/NewGroupModal";
import { useUiStore } from "@/stores/ui";

/** Mounts whichever modal is open in the UI store. */
export function ModalHost() {
  const modal = useUiStore((state) => state.modal);
  if (modal === "new-chat") return <NewChatModal />;
  if (modal === "add-contact") return <AddContactModal />;
  if (modal === "new-group") return <NewGroupModal />;
  if (modal === "group-info") return <GroupInfoModal />;
  if (modal === "forward") return <ForwardModal />;
  if (modal === "safety-number") return <SafetyNumberModal />;
  return null;
}
