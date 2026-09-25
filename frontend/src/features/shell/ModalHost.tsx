"use client";

import { AddContactModal } from "@/features/conversations/AddContactModal";
import { NewChatModal } from "@/features/conversations/NewChatModal";
import { NewGroupModal } from "@/features/groups/NewGroupModal";
import { useUiStore } from "@/stores/ui";

/** Mounts whichever modal is open in the UI store. */
export function ModalHost() {
  const modal = useUiStore((state) => state.modal);
  if (modal === "new-chat") return <NewChatModal />;
  if (modal === "add-contact") return <AddContactModal />;
  if (modal === "new-group") return <NewGroupModal />;
  return null;
}
