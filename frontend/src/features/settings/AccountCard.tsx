"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
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
  const dirty = name.trim() !== me.displayName || about !== me.about;

  const save = async () => {
    try {
      setUser(await updateMe({ displayName: name.trim(), about }));
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
          <p className="text-secondary text-[0.9375rem]">{me.phone}</p>
        </div>
      </div>
      <TextField
        id="profile-name"
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        id="profile-about"
        label="About"
        value={about}
        onChange={(e) => setAbout(e.target.value)}
      />
      <div className="flex gap-3">
        <Button disabled={!dirty || !name.trim()} onClick={() => void save()}>
          Save
        </Button>
        <Button variant="secondary" onClick={() => void signOut()}>
          Log out
        </Button>
      </div>
    </div>
  );
}
