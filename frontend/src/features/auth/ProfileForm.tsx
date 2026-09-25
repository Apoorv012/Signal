"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Icon } from "@/components/icons/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

/** Onboarding step 3: display name and optional avatar. */
export function ProfileForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>();

  const pickAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setAvatarUrl(URL.createObjectURL(file));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim()) router.push("/chats");
  };

  return (
    <form onSubmit={submit} className="flex flex-col items-stretch gap-5">
      <button
        type="button"
        aria-label="Choose profile photo"
        onClick={() => fileRef.current?.click()}
        className="relative mx-auto"
      >
        <Avatar name={name || "?"} src={avatarUrl} size={96} />
        <span className="bg-unread absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full border-2 border-white text-white">
          <Icon name="camera" size={18} />
        </span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickAvatar} />

      <TextField
        id="display-name"
        autoFocus
        label="Your name"
        placeholder="First and last name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button type="submit" fullWidth disabled={!name.trim()}>
        Finish
      </Button>
    </form>
  );
}
