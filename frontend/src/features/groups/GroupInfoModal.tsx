"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { TextField } from "@/components/ui/TextField";
import { ContactRow } from "@/features/conversations/ContactRow";
import { useContacts } from "@/hooks/useContacts";
import { filterUsers } from "@/lib/chat/users";
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
import type { Conversation, Member } from "@/types";

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
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState<string>();
  const [confirm, setConfirm] = useState<"leave" | Member | null>(null);

  if (!conversation) return null;
  const isAdmin = conversation.myRole === "admin";
  const editedTitle = title ?? conversation.title;
  const newTitle = editedTitle.trim();
  const canSaveTitle = isAdmin && newTitle !== "" && newTitle !== conversation.title;

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
    const available = contacts.filter((c) => !conversation.members.some((m) => m.user.id === c.id));
    const candidates = filterUsers(available, query);
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
        <div className="p-4 pb-2">
          <SearchInput
            placeholder="Search contacts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
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
            {available.length === 0
              ? "All your contacts are already in this group."
              : "No contacts match"}
          </p>
        )}
      </Modal>
    );
  }

  return (
    <Modal title="Group info" onClose={closeModal}>
      <div className="flex flex-col gap-3 p-4">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSaveTitle)
              void run(
                () => updateConversation(conversation.id, { title: newTitle }),
                "Group name updated",
              );
          }}
        >
          <TextField
            id="group-title"
            label="Group name"
            maxLength={100}
            value={editedTitle}
            disabled={!isAdmin}
            onChange={(e) => setTitle(e.target.value)}
          />
          {canSaveTitle && (
            <Button type="submit" variant="secondary" className="self-start">
              Save name
            </Button>
          )}
        </form>

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
              onRemove={() => setConfirm(member)}
            />
          ))}
        </ul>
      </div>

      <div className="border-divider border-t p-4">
        <Button variant="danger" fullWidth onClick={() => setConfirm("leave")}>
          Leave group
        </Button>
      </div>

      {confirm === "leave" && (
        <ConfirmDialog
          title="Leave group?"
          message={`You will no longer receive messages from "${conversation.title}".`}
          confirmLabel="Leave"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            void leave();
          }}
        />
      )}
      {confirm && confirm !== "leave" && (
        <ConfirmDialog
          title={`Remove ${confirm.user.displayName}?`}
          message={`They will be removed from "${conversation.title}".`}
          confirmLabel="Remove"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const { id } = confirm.user;
            setConfirm(null);
            void run(() => removeMember(conversation.id, id));
          }}
        />
      )}
    </Modal>
  );
}
