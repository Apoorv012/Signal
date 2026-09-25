"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { logout, verifyOtp } from "@/lib/api/auth";
import { clearPendingPhone, readPendingPhone } from "@/lib/pendingPhone";
import { useSessionStore } from "@/stores/session";

/** Verification is mocked on the server: every number receives the same fixed code. */
export const DEMO_OTP = "123456";

export function VerifyForm() {
  const router = useRouter();
  const [phone, setPhone] = useState<string | null>(null);
  const setSession = useSessionStore((state) => state.setSession);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  // The number comes from the register step (kept out of the URL); without it, start over.
  useEffect(() => {
    const saved = readPendingPhone();
    if (saved) setPhone(saved);
    else router.replace("/register");
  }, [router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!phone || code.length !== 6 || busy) return;
    setBusy(true);
    try {
      // Going back to fix a wrong number leaves a half-registered session behind: revoke it.
      const previous = useSessionStore.getState().token;
      const result = await verifyOtp(phone, code);
      if (previous) await logout().catch(() => undefined); // still uses the old token
      clearPendingPhone();
      setSession(result.token, result.user);
      // New accounts finish onboarding by choosing a name and photo.
      router.replace(result.isNewUser ? "/profile" : "/chats");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <p className="text-secondary text-center text-[0.9375rem]">
        Code sent to {phone ?? "your number"}. Demo code: <b className="text-text">{DEMO_OTP}</b>
      </p>
      <TextField
        id="otp"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        disabled={busy}
        maxLength={6}
        placeholder="------"
        className="text-center text-[1.5rem] tracking-[0.5em]"
        value={code}
        error={error}
        onChange={(e) => {
          setError(undefined);
          setCode(e.target.value.replace(/\D/g, ""));
        }}
      />
      <Button type="submit" fullWidth disabled={code.length !== 6 || busy || !phone}>
        {busy ? "Verifying…" : "Verify"}
      </Button>
      <Link href="/register" className="text-unread text-center text-[0.9375rem]">
        Wrong number?
      </Link>
    </form>
  );
}
