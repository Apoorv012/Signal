"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { loginWithUsername, registerWithUsername } from "@/lib/api/auth";
import { useSessionStore } from "@/stores/session";

const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,32}$/;
const MIN_PASSWORD = 8;

/** Sign up with (or log in to) a username + password instead of a phone number. */
export function UsernameForm() {
  const router = useRouter();
  const setSession = useSessionStore((state) => state.setSession);
  const [mode, setMode] = useState<"create" | "login">("create");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const creating = mode === "create";
  const valid =
    USERNAME_PATTERN.test(username) &&
    password.length >= MIN_PASSWORD &&
    (!creating || password === confirm);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      const result = creating
        ? await registerWithUsername(username, password)
        : await loginWithUsername(username, password);
      setSession(result.token, result.user);
      router.replace(result.isNewUser ? "/profile" : "/chats");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode(creating ? "login" : "create");
    setError(undefined);
    setConfirm("");
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <TextField
        id="username"
        label="Username"
        placeholder="e.g. maya_j"
        autoFocus
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="username"
        maxLength={32}
        disabled={busy}
        value={username}
        onChange={(e) => {
          setError(undefined);
          setUsername(e.target.value.replace(/\s/g, ""));
        }}
      />
      {username && !USERNAME_PATTERN.test(username) && (
        <p className="text-secondary -mt-2 text-[0.8125rem]">
          3–32 characters: letters, numbers, dots and underscores.
        </p>
      )}
      <TextField
        id="password"
        label="Password"
        type="password"
        autoComplete={creating ? "new-password" : "current-password"}
        maxLength={128}
        disabled={busy}
        value={password}
        onChange={(e) => {
          setError(undefined);
          setPassword(e.target.value);
        }}
      />
      {creating && (
        <TextField
          id="password-confirm"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          maxLength={128}
          disabled={busy}
          value={confirm}
          error={confirm && confirm !== password ? "Passwords do not match" : undefined}
          onChange={(e) => setConfirm(e.target.value)}
        />
      )}
      {creating && password && password.length < MIN_PASSWORD && (
        <p className="text-secondary -mt-2 text-[0.8125rem]">
          Use at least {MIN_PASSWORD} characters.
        </p>
      )}
      {error && <p className="text-danger text-[0.875rem]">{error}</p>}
      <Button type="submit" fullWidth disabled={!valid || busy}>
        {busy ? "Please wait…" : creating ? "Create account" : "Log in"}
      </Button>
      <button
        type="button"
        onClick={switchMode}
        className="text-unread text-center text-[0.9375rem]"
      >
        {creating ? "I already have a username account" : "Create a new account"}
      </button>
      <p className="text-secondary text-center text-[0.8125rem]">
        Others can add you with @username after you sign in.
      </p>
    </form>
  );
}
