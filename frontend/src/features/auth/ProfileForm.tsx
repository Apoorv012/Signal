"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Icon } from "@/components/icons/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { logout } from "@/lib/api/auth";
import { updateMe, uploadAvatar } from "@/lib/api/users";
import { useSessionStore } from "@/stores/session";

/** Onboarding step 3: display name and optional avatar. */
export function ProfileForm() {
  const router = useRouter();
  const setUser = useSessionStore((state) => state.setUser);
  const clearSession = useSessionStore((state) => state.clear);
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const pickAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (!picked) return;
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  };

  /** Discards the half-created session so the user can register with a different number. */
  const startOver = async () => {
    await logout().catch(() => undefined);
    clearSession();
    router.replace("/register");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      let user = await updateMe({ displayName: name.trim() });
      if (file) user = await uploadAvatar(file);
      setUser(user);
      router.replace("/chats");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col items-stretch gap-5">
      <button
        type="button"
        aria-label="Choose profile photo"
        onClick={() => fileRef.current?.click()}
        className="relative mx-auto"
      >
        <Avatar name={name || "?"} src={preview} size={96} />
        <span className="bg-unread absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full border-2 border-white text-white">
          <Icon name="camera" size={18} />
        </span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickAvatar} />

      <TextField
        id="display-name"
        autoFocus
        disabled={busy}
        label="Your name"
        placeholder="First and last name"
        value={name}
        error={error}
        onChange={(e) => setName(e.target.value)}
      />
      <Button type="submit" fullWidth disabled={!name.trim() || busy}>
        {busy ? "Saving…" : "Finish"}
      </Button>
      <button
        type="button"
        onClick={() => void startOver()}
        disabled={busy}
        className="text-unread text-center text-[0.9375rem] disabled:opacity-50"
      >
        Wrong number? Start over
      </button>
    </form>
  );
}
