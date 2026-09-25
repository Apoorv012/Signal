"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";
import { ContactRow } from "@/features/conversations/ContactRow";
import { useContacts } from "@/hooks/useContacts";
import { useConversation } from "@/hooks/useConversations";
import { useCurrentUser } from "@/hooks/useSession";
import {
  addMembers,
  removeMember,
  setMemberRole,
  updateConversation,
} from "@/lib/api/conversations";
import { removeConversation, upsertConversation } from "@/lib/query/cache";
import { useUiStore } from "@/stores/ui";
import type { Conversation } from "@/types";

import { MemberRow } from "./MemberRow";

const TIMER_OPTIONS = [
  { label: "Off", seconds: 0 },
  { label: "1 hour", seconds: 3600 },
  { label: "1 day", seconds: 86_400 },
  { label: "1 week", seconds: 604_800 },
];

type View = "info" | "add";

/** Group details: rename (admin), disappearing timer, members with admin controls, add, leave. */
export function GroupInfoModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useCurrentUser();
  const { closeModal, pushToast } = useUiStore();
  const conversationId = useUiStore((state) => state.modalConversationId) ?? 0;
  const { conversation } = useConversation(conversationId);
  const { contacts } = useContacts();
  const [view, setView] = useState<View>("info");
  const [picked, setPicked] = useState<number[]>([]);
  const [title, setTitle] = useState<string>();

  if (!conversation) return null;
  const isAdmin = conversation.myRole === "admin";
  const editedTitle = title ?? conversation.title;

  /** Runs an API call, stores the returned conversation, and reports errors as toasts. */
  const run = async (action: () => Promise<Conversation | null>, success?: string) => {
    try {
      const updated = await action();
      if (updated) upsertConversation(queryClient, updated);
      if (success) pushToast(success);
      return updated;
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Something went wrong");
      return undefined;
    }
  };

  const leave = async () => {
    const result = await run(() => removeMember(conversation.id, me.id));
    if (result === null) {
      removeConversation(queryClient, conversation.id);
      closeModal();
      router.replace("/chats");
    }
  };

  if (view === "add") {
    const candidates = contacts.filter(
      (c) => !conversation.members.some((m) => m.user.id === c.id),
    );
    return (
      <Modal
        title="Add members"
        onClose={closeModal}
        onBack={() => setView("info")}
        footer={
          <Button
            fullWidth
            disabled={picked.length === 0}
            onClick={async () => {
              await run(() => addMembers(conversation.id, picked), "Members added");
              setPicked([]);
              setView("info");
            }}
          >
            Add {picked.length || ""}
          </Button>
        }
      >
        {candidates.map((user) => (
          <ContactRow
            key={user.id}
            user={user}
            selected={picked.includes(user.id)}
            onSelect={() =>
              setPicked((ids) =>
                ids.includes(user.id) ? ids.filter((x) => x !== user.id) : [...ids, user.id],
              )
            }
          />
        ))}
        {candidates.length === 0 && (
          <p className="text-secondary px-4 py-8 text-center text-[0.9375rem]">
            All your contacts are already in this group.
          </p>
        )}
      </Modal>
    );
  }

  return (
    <Modal title="Group info" onClose={closeModal}>
      <div className="flex flex-col gap-3 p-4">
        <TextField
          id="group-title"
          label="Group name"
          value={editedTitle}
          disabled={!isAdmin}
          onChange={(e) => setTitle(e.target.value)}
        />
        {isAdmin && editedTitle.trim() && editedTitle.trim() !== conversation.title && (
          <Button
            variant="secondary"
            className="self-start"
            onClick={() =>
              run(() => updateConversation(conversation.id, { title: editedTitle.trim() }))
            }
          >
            Save name
          </Button>
        )}

        <label className="flex items-center justify-between gap-3 text-[1rem]">
          <span className="text-text">Disappearing messages</span>
          <select
            value={conversation.disappearingSeconds ?? 0}
            onChange={(e) =>
              run(() =>
                updateConversation(conversation.id, {
                  disappearingSeconds: Number(e.target.value),
                }),
              )
            }
            className="bg-field text-text [&>option]:bg-chat [&>option]:text-text rounded-lg px-3 py-2 text-[0.9375rem] outline-none"
          >
            {TIMER_OPTIONS.map((option) => (
              <option key={option.seconds} value={option.seconds}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="border-divider border-t">
        <h3 className="text-secondary flex items-center justify-between px-4 pt-3 pb-1 text-[0.875rem] font-medium">
          {conversation.members.length} members
          {isAdmin && (
            <button type="button" onClick={() => setView("add")} className="text-unread">
              + Add members
            </button>
          )}
        </h3>
        <ul>
          {conversation.members.map((member) => (
            <MemberRow
              key={member.user.id}
              member={member}
              isMe={member.user.id === me.id}
              canManage={isAdmin}
              onToggleAdmin={() =>
                run(() =>
                  setMemberRole(
                    conversation.id,
                    member.user.id,
                    member.role === "admin" ? "member" : "admin",
                  ),
                )
              }
              onRemove={() => run(() => removeMember(conversation.id, member.user.id))}
            />
          ))}
        </ul>
      </div>

      <div className="border-divider border-t p-4">
        <Button variant="danger" fullWidth onClick={() => void leave()}>
          Leave group
        </Button>
      </div>
    </Modal>
  );
}
