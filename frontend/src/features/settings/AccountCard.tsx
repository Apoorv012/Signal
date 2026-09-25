"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TextField } from "@/components/ui/TextField";
import { useCurrentUser } from "@/hooks/useSession";
import { logout } from "@/lib/api/auth";
import { updateMe } from "@/lib/api/users";
import { useSessionStore } from "@/stores/session";
import { useUiStore } from "@/stores/ui";

/** Profile summary with name editing, and the log out button. */
export function AccountCard() {
  const me = useCurrentUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useSessionStore((state) => state.setUser);
  const clearSession = useSessionStore((state) => state.clear);
  const pushToast = useUiStore((state) => state.pushToast);
  const [name, setName] = useState(me.displayName);
  const [about, setAbout] = useState(me.about);
  const [username, setUsername] = useState(me.username ?? "");
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const usernameChanged = username !== (me.username ?? "");
  const usernameValid = username === "" || /^[a-zA-Z0-9_.]{3,32}$/.test(username);
  const dirty = name.trim() !== me.displayName || about !== me.about || usernameChanged;

  const save = async () => {
    try {
      setUser(
        await updateMe({
          displayName: name.trim(),
          about,
          ...(usernameChanged && username ? { username } : {}),
        }),
      );
      pushToast("Profile updated");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not save profile");
    }
  };

  const signOut = async () => {
    await logout().catch(() => undefined); // even if the server is unreachable, sign out locally
    clearSession();
    queryClient.clear();
    router.replace("/register");
  };

  return (
    <div className="border-divider mb-4 flex flex-col gap-4 border-b pb-6">
      <div className="flex items-center gap-4">
        <Avatar name={me.displayName} src={me.avatarUrl} size={64} />
        <div className="min-w-0">
          <p className="text-text truncate text-[1.125rem] font-semibold">{me.displayName}</p>
          <p className="text-secondary text-[0.9375rem]">
            {me.phone ?? (me.username ? `@${me.username}` : "")}
          </p>
        </div>
      </div>
      <TextField
        id="profile-name"
        maxLength={64}
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        id="profile-username"
        maxLength={32}
        label="Username"
        placeholder="Others can add you with @username"
        autoCapitalize="none"
        autoCorrect="off"
        value={username}
        error={usernameValid ? undefined : "3–32 characters: letters, numbers, . and _"}
        onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
      />
      <TextField
        id="profile-about"
        maxLength={140}
        label="About"
        value={about}
        onChange={(e) => setAbout(e.target.value)}
      />
      <div className="flex gap-3">
        <Button disabled={!dirty || !name.trim() || !usernameValid} onClick={() => void save()}>
          Save
        </Button>
        <Button variant="secondary" onClick={() => setConfirmingLogout(true)}>
          Log out
        </Button>
      </div>
      {confirmingLogout && (
        <ConfirmDialog
          title="Log out?"
          message={
            me.phone
              ? "You will need to verify your number again to sign back in."
              : "You will need your username and password to sign back in."
          }
          confirmLabel="Log out"
          onCancel={() => setConfirmingLogout(false)}
          onConfirm={() => void signOut()}
        />
      )}
    </div>
  );
}
